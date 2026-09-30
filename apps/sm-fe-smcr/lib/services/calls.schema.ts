import { z } from "zod";

/**
 * Prodotti ammessi da GET /calls. Allineato a PRODUCT_IDS in
 * packages/db-monitoring/src/schema.ts.
 */
export const CALL_PRODUCT_IDS = [
  "prod-pn",
  "prod-io",
  "prod-pagopa",
  "prod-idpay",
  "prod-idpay-merchant",
  "prod-checkiban",
  "prod-interop",
  "prod-io-premium",
  "prod-io-sign",
  "prod-rtp",
] as const;

export type CallProductId = (typeof CALL_PRODUCT_IDS)[number];

export const CALL_PRODUCT_LABELS: Record<CallProductId, string> = {
  "prod-pn": "SEND",
  "prod-io": "IO",
  "prod-pagopa": "PagoPA",
  "prod-idpay": "IDPay",
  "prod-idpay-merchant": "IDPay Merchant",
  "prod-checkiban": "Check IBAN",
  "prod-interop": "Interoperabilità",
  "prod-io-premium": "IO Premium",
  "prod-io-sign": "Firma con IO",
  "prod-rtp": "RTP",
};

export const CALLS_LIMIT_DEFAULT = 50;
export const CALLS_LIMIT_MAX = 200;

const CALL_PRODUCT_ID_SET = new Set<string>(CALL_PRODUCT_IDS);

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const LIMIT_MESSAGE = `Il limite deve essere un numero intero tra 1 e ${CALLS_LIMIT_MAX}`;

export type ListCallsInput = {
  productId?: string;
  institutionId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: string;
};

export type ListCallsQuery = {
  productId?: CallProductId;
  institutionId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export type CallFieldError = {
  field: string;
  message: string;
};

export function callProductLabel(productId: string) {
  if (productId in CALL_PRODUCT_LABELS) {
    return CALL_PRODUCT_LABELS[productId as CallProductId];
  }
  return productId;
}

function blankToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const listCallsQuerySchema = z
  .object({
    productId: z.string().optional(),
    institutionId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    limit: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const productId = blankToUndefined(data.productId);
    if (productId && !CALL_PRODUCT_ID_SET.has(productId)) {
      ctx.addIssue({
        code: "custom",
        path: ["productId"],
        message: "Prodotto non ammesso",
      });
    }

    const institutionId = blankToUndefined(data.institutionId);
    if (institutionId && !UUID_PATTERN.test(institutionId)) {
      ctx.addIssue({
        code: "custom",
        path: ["institutionId"],
        message: "Inserisci un GUID valido",
      });
    }

    const dateFrom = blankToUndefined(data.dateFrom);
    const dateTo = blankToUndefined(data.dateTo);
    const dateFromMs = dateFrom ? Date.parse(dateFrom) : undefined;
    const dateToMs = dateTo ? Date.parse(dateTo) : undefined;

    if (dateFrom && Number.isNaN(dateFromMs)) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFrom"],
        message: "Data non valida",
      });
    }

    if (dateTo && Number.isNaN(dateToMs)) {
      ctx.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "Data non valida",
      });
    }

    if (
      dateFromMs !== undefined &&
      dateToMs !== undefined &&
      !Number.isNaN(dateFromMs) &&
      !Number.isNaN(dateToMs) &&
      dateFromMs > dateToMs
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFrom"],
        message: "La data iniziale deve essere precedente o uguale alla data finale",
      });
    }

    const rawLimit = blankToUndefined(data.limit);
    if (rawLimit) {
      const limit = Number(rawLimit);
      if (!Number.isInteger(limit) || limit < 1 || limit > CALLS_LIMIT_MAX) {
        ctx.addIssue({
          code: "custom",
          path: ["limit"],
          message: LIMIT_MESSAGE,
        });
      }
    }
  })
  .transform((data): ListCallsQuery => {
    const productId = blankToUndefined(data.productId);
    const institutionId = blankToUndefined(data.institutionId);
    const dateFrom = blankToUndefined(data.dateFrom);
    const dateTo = blankToUndefined(data.dateTo);
    const rawLimit = blankToUndefined(data.limit);

    return {
      productId: productId as CallProductId | undefined,
      institutionId,
      dateFrom,
      dateTo,
      limit: rawLimit ? Number(rawLimit) : undefined,
    };
  });

export function buildCallsSearchParams(query: ListCallsQuery) {
  const params = new URLSearchParams();

  if (query.productId) {
    params.set("productId", query.productId);
  }
  if (query.institutionId) {
    params.set("institutionId", query.institutionId);
  }
  if (query.dateFrom) {
    params.set("dateFrom", query.dateFrom);
  }
  if (query.dateTo) {
    params.set("dateTo", query.dateTo);
  }
  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  return params;
}

export const monitoringCallSchema = z.object({
  id: z.string(),
  crmActivityId: z.string(),
  title: z.string().nullish(),
  institutionId: z.string().nullish(),
  institutionName: z.string().nullish(),
  productId: z.string(),
  callDate: z.string(),
  link: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listCallsResponseSchema = z.object({
  success: z.literal(true),
  count: z.number(),
  data: z.array(monitoringCallSchema),
});

export type MonitoringCall = z.infer<typeof monitoringCallSchema>;

export type ListCallsResult =
  | { success: true; data: MonitoringCall[]; count: number }
  | { success: false; message: string; fields?: CallFieldError[] };
