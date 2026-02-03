// =============================================================================
// ACCOUNTS SERVICE - Gestione Enti/Clienti su Dynamics 365
// =============================================================================

import type { Account, DynamicsList } from "../types/dynamics";
import { get, buildUrl } from "./httpClient";

// =============================================================================
// ACCOUNTS
// =============================================================================

/**
 * Cerca un Ente (Account) in Dynamics tramite Selfcare ID.
 * 
 * Endpoint 1: GET /api/data/v9.2/accounts?$filter=pgp_identificativoselfcare eq '{id}'
 * 
 * @param institutionIdSelfcare - ID Selfcare dell'ente
 * @returns Account trovato o null se non esiste
 * @throws Error se trovati più enti (ambiguità)
 */
export async function getAccountBySelfcareId(
  institutionIdSelfcare: string,
): Promise<Account | null> {
  const url = buildUrl({
    endpoint: "/api/data/v9.2/accounts",
    filter: `pgp_identificativoselfcare eq '${institutionIdSelfcare}'`,
    select:
      "accountid,name,pgp_identificativoselfcare,pgp_denominazioneselfcare,emailaddress1,telephone1,address1_composite,statecode",
  });

  console.log(
    `[Accounts] Ricerca ente per Selfcare ID: ${institutionIdSelfcare}`,
  );

  const result = await get<Account>(url);

  if (!result.value || result.value.length === 0) {
    console.log(
      `[Accounts] Nessun ente trovato per Selfcare ID: ${institutionIdSelfcare}`,
    );
    return null;
  }

  if (result.value.length > 1) {
    console.warn(
      `[Accounts] Trovati ${result.value.length} enti per Selfcare ID: ${institutionIdSelfcare}`,
    );
    throw new Error(
      `Ambiguità: trovati ${result.value.length} enti per Selfcare ID ${institutionIdSelfcare}`,
    );
  }

  console.log(
    `[Accounts] Ente trovato: ${result.value[0].name} (${result.value[0].accountid})`,
  );
  return result.value[0];
}

/**
 * Cerca un Ente (Account) in Dynamics tramite nome (fallback).
 * 
 * Endpoint 2: GET /api/data/v9.2/accounts?$filter=contains(tolower(name), '{nome}')
 * 
 * @param nomeEnte - Nome dell'ente da cercare
 * @returns Account trovato o null se non esiste
 * @throws Error se trovati più enti (ambiguità)
 */
export async function getAccountByName(
  nomeEnte: string,
): Promise<Account | null> {
  // Escape single quotes nel nome
  const escapedName = nomeEnte.toLowerCase().replace(/'/g, "''");

  const url = buildUrl({
    endpoint: "/api/data/v9.2/accounts",
    filter: `contains(tolower(name), '${escapedName}') and pgp_identificativoselfcare eq null`,
    select:
      "accountid,name,pgp_identificativoselfcare,pgp_denominazioneselfcare,emailaddress1,telephone1,address1_composite,statecode",
  });

  console.log(`[Accounts] Ricerca ente per nome: ${nomeEnte}`);

  const result = await get<Account>(url);

  if (!result.value || result.value.length === 0) {
    console.log(`[Accounts] Nessun ente trovato per nome: ${nomeEnte}`);
    return null;
  }

  if (result.value.length > 1) {
    console.warn(
      `[Accounts] Trovati ${result.value.length} enti per nome: ${nomeEnte}`,
    );
    throw new Error(
      `Ambiguità: trovati ${result.value.length} enti per nome "${nomeEnte}". Specificare institutionIdSelfcare.`,
    );
  }

  console.log(
    `[Accounts] Ente trovato: ${result.value[0].name} (${result.value[0].accountid})`,
  );
  return result.value[0];
}

// -----------------------------------------------------------------------------
// Verifica Ente (orchestratore)
// -----------------------------------------------------------------------------

export interface VerifyAccountParams {
  institutionIdSelfcare?: string;
  nomeEnte?: string;
  enableFallback: boolean;
}

export interface VerifyAccountResult {
  found: boolean;
  account: Account | null;
  method: "selfcareId" | "name" | "none";
  error?: string;
}

export async function verifyAccount(
  params: VerifyAccountParams,
): Promise<VerifyAccountResult> {
  // Prima prova con Selfcare ID
  if (params.institutionIdSelfcare) {
    try {
      const account = await getAccountBySelfcareId(
        params.institutionIdSelfcare,
      );
      if (account) {
        return { found: true, account, method: "selfcareId" };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Ambiguità")) {
        return {
          found: false,
          account: null,
          method: "selfcareId",
          error: msg,
        };
      }
      throw error;
    }
  }

  // Fallback su nome ente se ho passato nomeEnte ed enableFallback è true (default false!)
  if (params.nomeEnte && params.enableFallback) {
    try {
      const account = await getAccountByName(params.nomeEnte);
      if (account) {
        return { found: true, account, method: "name" };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Ambiguità")) {
        return { found: false, account: null, method: "name", error: msg };
      }
      throw error;
    }
  }

  return {
    found: false,
    account: null,
    method: "none",
    error:
      "Nessun parametro di ricerca fornito (institutionIdSelfcare o nomeEnte)",
  };
}
