// =============================================================================
// CALLS HANDLER - Handler HTTP per Azure Functions
// =============================================================================

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { z } from "zod";
import { upsertCall, listCalls, PRODUCT_IDS, type Call } from "@repo/db-monitoring";
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
// Cap usato per recuperare un pool sufficiente da filtrare per data lato
// applicativo (vedi filterByDateRange). Va rimosso quando il filtro per data
// sarà spostato dentro @repo/db-monitoring.listCalls.
const DATE_FILTER_FETCH_CAP = 500;

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

/**
 * Filtra le call per range temporale in-memory: @repo/db-monitoring.listCalls
 * non espone ancora un filtro per data (solo productId/institutionId). È una
 * misura interinale, da rimuovere quando il filtro verrà spostato nel package
 * condiviso (query SQL con gte/lte su call_date).
 */
function filterByDateRange(calls: Call[], dateFrom?: Date, dateTo?: Date): Call[] {
  if (!dateFrom && !dateTo) return calls;

  return calls.filter((call) => {
    if (dateFrom && call.callDate < dateFrom) return false;
    if (dateTo && call.callDate > dateTo) return false;
    return true;
  });
}

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
  const requestedLimit = limit ?? DEFAULT_LIST_LIMIT;
  const hasDateFilter = dateFrom !== undefined || dateTo !== undefined;

  try {
    const calls = await listCalls({
      limit: hasDateFilter ? DATE_FILTER_FETCH_CAP : requestedLimit,
      productId,
      institutionId,
    });

    const data = filterByDateRange(calls, dateFrom, dateTo).slice(0, requestedLimit);

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
