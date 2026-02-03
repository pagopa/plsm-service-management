// =============================================================================
// CRM MAPPINGS - Mapping hardcoded per l'integrazione con Dynamics 365
// =============================================================================

import type { TipologiaReferente, ProductIdSelfcare, Environment } from "../types/dynamics";

// -----------------------------------------------------------------------------
// Mapping Prodotti Selfcare → GUID CRM
// -----------------------------------------------------------------------------

export const PRODUCTS_MAP: Record<Environment, Record<ProductIdSelfcare, string>> = {
  DEV: {
    "prod-pn": "617cbe1b-bb58-f011-877b-000d3a662132",
    "prod-io": "26a975ef-a205-f011-bae4-000d3ab7023d",
    "prod-pagopa": "c00c3e9a-a205-f011-bae3-000d3adf9667",
    "prod-idpay": "04c4d12b-a205-f011-bae3-000d3adf9667",
    "prod-idpay-merchant": "637cbe1b-bb58-f011-877b-000d3a662132",
    "prod-checkiban": "22a975ef-a205-f011-bae4-000d3ab7023d",
    "prod-interop": "24a975ef-a205-f011-bae4-000d3ab7023d",
    "prod-io-premium": "46af0f1c-bb58-f011-877b-6045bdde77c4",
    "prod-io-sign": "ca089f05-bd58-f011-877b-6045bdde7236",
    "prod-rtp": "dde9d520-5f11-f011-998b-000d3adf9667",
  },
  UAT: {
    "prod-pn": "617cbe1b-bb58-f011-877b-000d3a662132",
    "prod-io": "26a975ef-a205-f011-bae4-000d3ab7023d",
    "prod-pagopa": "c00c3e9a-a205-f011-bae3-000d3adf9667",
    "prod-idpay": "04c4d12b-a205-f011-bae3-000d3adf9667",
    "prod-idpay-merchant": "637cbe1b-bb58-f011-877b-000d3a662132",
    "prod-checkiban": "22a975ef-a205-f011-bae4-000d3ab7023d",
    "prod-interop": "24a975ef-a205-f011-bae4-000d3ab7023d",
    "prod-io-premium": "46af0f1c-bb58-f011-877b-6045bdde77c4",
    "prod-io-sign": "ca089f05-bd58-f011-877b-6045bdde7236",
    "prod-rtp": "dde9d520-5f11-f011-998b-000d3adf9667",
  },
  PROD: {
    "prod-pn": "77d197d1-cf51-f011-877b-6045bdddeb37",
    "prod-io": "fbe295d3-cf51-f011-877b-6045bde1138f",
    "prod-pagopa": "63a165d1-cf51-f011-877b-7c1e52876621",
    "prod-idpay": "65a165d1-cf51-f011-877b-7c1e52876621",
    "prod-idpay-merchant": "66a165d1-cf51-f011-877b-7c1e52876621",
    "prod-checkiban": "67a165d1-cf51-f011-877b-7c1e52876621",
    "prod-interop": "7b0e7ad1-cf51-f011-877a-7c1e5287ed24",
    "prod-io-premium": "7c0e7ad1-cf51-f011-877a-7c1e5287ed24",
    "prod-io-sign": "4618d3d1-cf51-f011-877a-7ced8d4a21cf",
    // NOTA: prod-rtp non presente in PROD secondo la documentazione
    "prod-rtp": "",
  },
};

// -----------------------------------------------------------------------------
// Mapping Tipologia Referente → ID numerico CRM
// -----------------------------------------------------------------------------

export const TIPOLOGIA_REFERENTE_MAP: Record<TipologiaReferente, number> = {
  APICALE: 100000000,
  DIRETTO: 100000001,
  TECNICO: 100000002,
  BUSINESS: 100000003,
  ACCOUNT: 100000004,
  RESPONSABILE_DI_TRASFORMAZIONE_DIGITALE: 100000005,
  REFERENTE_CONTRATTUALE: 100000006,
  RESPONSABILE_PROTEZIONE_DATI: 100000007,
  REFERENTE_BUSINESS_APICALE_ACCOUNT: 100000008,
};

// -----------------------------------------------------------------------------
// Mapping Team per GrantAccess
// -----------------------------------------------------------------------------

export const TEAMS_MAP: Record<Environment, string> = {
  DEV: "5f9c165c-1e7d-ef11-ac20-000d3ad807dc",
  UAT: "5f9c165c-1e7d-ef11-ac20-000d3ad807dc",
  PROD: "5f9c165c-1e7d-ef11-ac20-000d3ad807dc",
};

// -----------------------------------------------------------------------------
// URL base per ambiente
// -----------------------------------------------------------------------------

export const BASE_URLS: Record<Environment, string> = {
  DEV: "https://dev-pagopa.crm4.dynamics.com",
  UAT: "https://uat-pagopa.crm4.dynamics.com",
  PROD: "https://pagopa.crm4.dynamics.com",
};

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

export function getProductGuid(
  productId: ProductIdSelfcare,
  environment: Environment
): string | null {
  const guid = PRODUCTS_MAP[environment]?.[productId];
  if (!guid) {
    console.warn(`Prodotto ${productId} non trovato per ambiente ${environment}`);
    return null;
  }
  return guid;
}

export function getTipologiaReferenteId(tipologia: TipologiaReferente): number {
  return TIPOLOGIA_REFERENTE_MAP[tipologia];
}

export function getTeamId(environment: Environment): string {
  return TEAMS_MAP[environment];
}

export function getBaseUrl(environment: Environment): string {
  return BASE_URLS[environment];
}

export function resolveEnvironment(baseUrl: string): Environment {
  if (baseUrl.includes("dev-pagopa")) return "DEV";
  if (baseUrl.includes("uat-pagopa")) return "UAT";
  if (baseUrl.includes("pagopa.crm4")) return "PROD";
  return "UAT"; // Default
}
