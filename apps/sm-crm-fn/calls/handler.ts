// =============================================================================
// CALLS HANDLER - Handler HTTP per Azure Functions
// =============================================================================

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { z } from "zod";
import {
  upsertCall,
  listCalls,
  getCallsSummary,
  PRODUCT_IDS,
} from "@repo/db-monitoring";
import { createLogger } from "../_shared/utils/logger";

// Verifica solo il formato (8-4-4-4-12 esadecimale): zod .uuid() impone anche
// i nibble di versione/variante RFC 4122, che Postgres non richiede e che
// scarterebbero GUID legittimi (es. activity id Dynamics) non conformi.
const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "UUID non valido",
  );

// -----------------------------------------------------------------------------
// POST /calls - Registra una call
// -----------------------------------------------------------------------------

const createCallSchema = z.object({
  crmActivityId: uuidSchema,
  title: z.string().trim().min(1).optional(),
  institutionId: uuidSchema.optional(),
  institutionName: z.string().trim().min(1).optional(),
  productId: z.enum(PRODUCT_IDS),
  callDate: z.coerce.date(),
  link: z.string().url().optional(),
});

export async function createCallHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createLogger(context);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      status: 400,
      jsonBody: {
        success: false,
        message: "Body JSON non valido",
        timestamp: new Date().toISOString(),
      },
    };
  }

  const parsed = createCallSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn("Validation errors", { issues: parsed.error.issues });
    return {
      status: 400,
      jsonBody: {
        success: false,
        message: "Errore di validazione",
        error: {
          code: "VALIDATION_ERROR",
          fields: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    const id = await upsertCall(parsed.data);
    logger.info("Call registrata", {
      crmActivityId: parsed.data.crmActivityId,
    });

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: { id },
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Errore durante la registrazione della call", error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante la registrazione della call",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// -----------------------------------------------------------------------------
// GET /calls - Lista call, con filtri facoltativi e componibili
// -----------------------------------------------------------------------------

const DEFAULT_LIST_LIMIT = 50;

const listCallsQuerySchema = z
  .object({
    productId: z.enum(PRODUCT_IDS).optional(),
    institutionId: uuidSchema.optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
  })
  .refine((data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo, {
    message: "dateFrom deve essere precedente o uguale a dateTo",
    path: ["dateFrom"],
  });

export async function listCallsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createLogger(context);

  const rawQuery = {
    productId: request.query.get("productId") ?? undefined,
    institutionId: request.query.get("institutionId") ?? undefined,
    dateFrom: request.query.get("dateFrom") ?? undefined,
    dateTo: request.query.get("dateTo") ?? undefined,
    limit: request.query.get("limit") ?? undefined,
  };

  const parsed = listCallsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    logger.warn("Validation errors", { issues: parsed.error.issues });
    return {
      status: 400,
      jsonBody: {
        success: false,
        message: "Errore di validazione",
        error: {
          code: "VALIDATION_ERROR",
          fields: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  const { productId, institutionId, dateFrom, dateTo, limit } = parsed.data;

  try {
    const data = await listCalls({
      limit: limit ?? DEFAULT_LIST_LIMIT,
      productId,
      institutionId,
      callDateFrom: dateFrom,
      callDateTo: dateTo,
    });

    logger.info("Call recuperate", {
      resultCount: data.length,
      productId,
      institutionId,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data,
        count: data.length,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Errore durante il recupero delle call", error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante il recupero delle call",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// -----------------------------------------------------------------------------
// GET /calls/summary - Totale call e top 3 prodotti per numero di call, per
// anno oppure per range libero (dateFrom/dateTo)
// -----------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getUTCFullYear();

const callsSummaryQuerySchema = z
  .object({
    year: z.coerce
      .number()
      .int()
      .min(2000)
      // Margine di un anno oltre il corrente: evita input palesemente errati
      // senza dover ridistribuire la Function ogni capodanno.
      .max(CURRENT_YEAR + 1)
      .optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  })
  .refine(
    (data) =>
      data.year === undefined ||
      (data.dateFrom === undefined && data.dateTo === undefined),
    {
      message: "Specificare year oppure dateFrom/dateTo, non entrambi",
      path: ["year"],
    },
  )
  .refine((data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo, {
    message: "dateFrom deve essere precedente o uguale a dateTo",
    path: ["dateFrom"],
  });

export async function callsSummaryHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createLogger(context);

  const parsed = callsSummaryQuerySchema.safeParse({
    year: request.query.get("year") ?? undefined,
    dateFrom: request.query.get("dateFrom") ?? undefined,
    dateTo: request.query.get("dateTo") ?? undefined,
  });

  if (!parsed.success) {
    logger.warn("Validation errors", { issues: parsed.error.issues });
    return {
      status: 400,
      jsonBody: {
        success: false,
        message: "Errore di validazione",
        error: {
          code: "VALIDATION_ERROR",
          fields: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    const data = await getCallsSummary(parsed.data);

    logger.info("Sintesi call recuperata", {
      year: parsed.data.year,
      dateFrom: parsed.data.dateFrom?.toISOString(),
      dateTo: parsed.data.dateTo?.toISOString(),
      totalCalls: data.totalCalls,
      rosterSize: data.roster.length,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Errore durante il recupero della sintesi delle call", error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante il recupero della sintesi delle call",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
