export enum Products {
  IO = "prod-io",
  INTEROP = "prod-interop",
  INTEROP_COLL = "prod-interop-coll",
  SEND = "prod-pn",
}

export const PRODUCT_MAP: Record<string, string> = {
  "prod-fd": "prod-fd",
  "prod-interop": "Interoperabilità",
  "prod-interop-atst": "Interoperabilità Attestazione",
  "prod-interop-coll": "Interoperabilità Collaudo",
  "prod-io": "IO",
  "prod-io-premium": "IO Premium",
  "prod-io-sign": "Firma con IO",
  "prod-pagopa": "Piattaforma pagoPA",
  "prod-pn": "SEND",
  "prod-pn-pg": "prod-pn-pg",
  "prod-fd-garantito": "Fidejussioni ditali G",
  "prod-idpay-merchant": "prod-idpay-merchant",
} as const;
