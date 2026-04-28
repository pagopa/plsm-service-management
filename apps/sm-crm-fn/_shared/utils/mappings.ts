// =============================================================================
// CRM MAPPINGS - Mapping per l'integrazione con Dynamics 365
// =============================================================================
//
// PRODUCTS_MAP e TIPOLOGIA_REFERENTE_MAP sono gestiti via Azure Key Vault.
// Le env var corrispondenti (CRM_PRODUCTS_MAP_UAT, CRM_PRODUCTS_MAP_PROD,
// CRM_TIPOLOGIA_REFERENTE_MAP_UAT, CRM_TIPOLOGIA_REFERENTE_MAP_PROD) sono
// obbligatorie a runtime e vengono iniettate a deploy-time da Terraform.
//
// Per sviluppo locale: copiare local.settings.json.example in local.settings.json
// e popolare le variabili con i valori dell'ambiente di test.
//
// =============================================================================

import type {
  TipologiaReferente,
  ProductIdSelfcare,
  Environment,
} from "../types/dynamics";
import { getConfig } from "./config";

// -----------------------------------------------------------------------------
// Mapping Picklist pgp_oggettodelcontatto su appointment
// (identico in UAT e PROD — non gestito via KV)
// -----------------------------------------------------------------------------

/**
 * Mapping dei valori della Picklist pgp_oggettodelcontatto su appointment.
 *
 * Valori forniti dal team Dynamics - identici in UAT e PROD.
 *
 * @default 100000005 (Integrazione Tecnica) - valore suggerito per il caso d'uso corrente
 */
export const OGGETTO_DEL_CONTATTO_MAP: Record<string, number> = {
  opportunita: 100000000,
  "post-vendita": 100000001,
  informativa: 100000002,
  comunicazione: 100000003,
  "pre-sales": 100000004,
  "integrazione-tecnica": 100000005, // Default suggerito
};

/**
 * Tipo per i valori validi di oggettoDelContatto
 */
export type OggettoDelContatto = keyof typeof OGGETTO_DEL_CONTATTO_MAP;

// -----------------------------------------------------------------------------
// Mapping Team per GrantAccess (non gestito via KV)
// -----------------------------------------------------------------------------

export const TEAMS_MAP: Record<Environment, string> = {
  UAT: "5f9c165c-1e7d-ef11-ac20-000d3ad807dc",
  PROD: "5f9c165c-1e7d-ef11-ac20-000d3ad807dc",
};

// -----------------------------------------------------------------------------
// URL base per ambiente (non gestito via KV)
// -----------------------------------------------------------------------------

export const BASE_URLS: Record<Environment, string> = {
  UAT: "https://uat-pagopa.crm4.dynamics.com",
  PROD: "https://pagopa.crm4.dynamics.com",
};

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

/**
 * Restituisce il GUID CRM del prodotto per l'ambiente specificato.
 * Il valore viene letto dalla env var KV (CRM_PRODUCTS_MAP_UAT / CRM_PRODUCTS_MAP_PROD),
 * obbligatoria a runtime — configurata via Key Vault a deploy-time.
 *
 * @param productId - ID Selfcare del prodotto
 * @param environment - Ambiente Dynamics (UAT | PROD)
 * @returns GUID del prodotto o null se non presente nella mappa
 */
export function getProductGuid(
  productId: ProductIdSelfcare,
  environment: Environment,
): string | null {
  const config = getConfig();
  const map = environment === "UAT"
    ? config.CRM_PRODUCTS_MAP_UAT
    : config.CRM_PRODUCTS_MAP_PROD;
  const guid = map[productId];
  if (!guid) {
    console.warn(`[mappings] Prodotto ${productId} non trovato nella mappa KV per ${environment}`);
    return null;
  }
  return guid;
}

export function getTipologiaReferenteId(
  tipologia: TipologiaReferente,
  environment: Environment,
): number {
  const config = getConfig();
  const map = environment === "UAT"
    ? config.CRM_TIPOLOGIA_REFERENTE_MAP_UAT
    : config.CRM_TIPOLOGIA_REFERENTE_MAP_PROD;
  const id = map[tipologia];
  if (typeof id !== "number" || !Number.isFinite(id)) {
    throw new Error(
      `[mappings] Tipologia referente non valida o non configurata per ${environment}: ${tipologia}`,
    );
  }
  return id;
}

export function getTeamId(environment: Environment): string {
  return TEAMS_MAP[environment];
}

export function getBaseUrl(environment: Environment): string {
  return BASE_URLS[environment];
}

export function resolveEnvironment(baseUrl: string): Environment {
  if (baseUrl.includes("uat-pagopa")) return "UAT";
  return "PROD";
}
