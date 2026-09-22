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
// anno oppure per range libero (dateFrom/dateTo, formato italiano GG/MM/AAAA)
// -----------------------------------------------------------------------------

const ITALIAN_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MIN_SUMMARY_YEAR = 2000;

/**
 * Interpreta una data in formato italiano GG/MM/AAAA come istante UTC.
 * A differenza di `new Date(stringa)`, non è ambiguo: JS interpreterebbe
 * "01/03/2026" alla americana (mese/giorno/anno, cioè 3 gennaio) invece che
 * come 1 marzo 2026.
 */
function parseItalianDate(value: string): Date | undefined {
  const match = ITALIAN_DATE_PATTERN.exec(value);
  if (!match) {
    return undefined;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC normalizza le date di calendario inesistenti (es. 31/02)
  // rollando al mese successivo: il round-trip le scarta.
  const isValidCalendarDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValidCalendarDate ? date : undefined;
}

/**
 * Schema per un parametro data in formato GG/MM/AAAA (solo giorno, senza ora).
 * `boundary: "end"` sposta l'istante alla fine della giornata (23:59:59.999)
 * perché dateTo è inclusivo: senza questo, una call delle 14:00 del giorno
 * stesso verrebbe esclusa dal confronto `<=` lato query.
 */
function italianDateSchema(boundary: "start" | "end") {
  return z
    .string()
    .transform((value, ctx) => {
      const date = parseItalianDate(value);
      if (!date) {
        ctx.addIssue({
          code: "custom",
          message: "Formato data non valido: atteso GG/MM/AAAA (es. 01/03/2026)",
        });
        return z.NEVER;
      }

      return boundary === "end" ? new Date(date.getTime() + ONE_DAY_MS - 1) : date;
    })
    .optional();
}

const callsSummaryQuerySchema = z
  .object({
    year: z.coerce.number().int().min(MIN_SUMMARY_YEAR).optional(),
    dateFrom: italianDateSchema("start"),
    dateTo: italianDateSchema("end"),
  })
  .refine(
    // Calcolato ad ogni richiesta (non in una costante di modulo): su
    // un'istanza Azure Functions "warm" a cavallo di Capodanno, un bound
    // fissato al cold-start resterebbe stantio.
    (data) => data.year === undefined || data.year <= new Date().getUTCFullYear() + 1,
    {
      message: "year non può superare l'anno corrente + 1",
      path: ["year"],
    },
  )
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
