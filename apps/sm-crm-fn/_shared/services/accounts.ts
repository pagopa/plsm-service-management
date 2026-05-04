// =============================================================================
// ACCOUNTS SERVICE - Gestione Enti/Clienti su Dynamics 365
// =============================================================================

import type { Account, DynamicsList } from "../types/dynamics";
import { get, buildUrl } from "./httpClient";
import { createLogger, logODataQuery, Timer } from "../utils/logger";
import type { DiagnosticSession } from "./diagnosticLogger";
import { addDiagnosticCall } from "./diagnosticLogger";

// =============================================================================
// ACCOUNTS
// =============================================================================

/**
 * Cerca un Ente (Account) in Dynamics tramite Selfcare ID.
 *
 * Endpoint 1: GET /api/data/v9.2/accounts?$filter=pgp_identificativoselfcare eq '{id}'
 *
 * @param institutionIdSelfcare - ID Selfcare dell'ente
 * @param baseUrl - Base URL for Dynamics environment
 * @returns Account trovato o null se non esiste
 * @throws Error se trovati più enti (ambiguità)
 */
export async function getAccountBySelfcareId(
  institutionIdSelfcare: string,
  baseUrl: string,
  diagnosticSession?: DiagnosticSession,
): Promise<Account | null> {
  const logger = createLogger(undefined, { institutionIdSelfcare });
  const timer = new Timer();

  logger.info("🔍 Searching account by Selfcare ID", { institutionIdSelfcare });

  const filter = `pgp_identificativoselfcare eq '${institutionIdSelfcare}'`;
  const select =
    "accountid,name,pgp_identificativoselfcare,pgp_denominazioneselfcare,emailaddress1,telephone1,address1_composite,statecode";

  const url = buildUrl({
    baseUrl,
    endpoint: "/api/data/v9.2/accounts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/accounts", filter, select);

  const startMs = Date.now();
  try {
    const result = await get<Account>(url, baseUrl);
    const duration = timer.elapsed();

    if (diagnosticSession) {
      addDiagnosticCall(diagnosticSession, {
        step: "verifyAccount",
        method: "GET",
        url,
        requestBody: null,
        responseStatus: 200,
        durationMs: Date.now() - startMs,
      });
    }

    // Simple console log for Azure Log Stream visibility
    console.log(
      `[ACCOUNT SEARCH RESULT] Found: ${result.value?.length ?? 0} accounts`,
    );

    if (!result.value || result.value.length === 0) {
      logger.warn("⚠️ No account found for Selfcare ID", {
        institutionIdSelfcare,
        duration,
      });
      return null;
    }

    if (result.value.length > 1) {
      logger.error("❌ Multiple accounts found for Selfcare ID", undefined, {
        institutionIdSelfcare,
        count: result.value.length,
        duration,
      });
      throw new Error(
        `Ambiguità: trovati ${result.value.length} enti per Selfcare ID ${institutionIdSelfcare}`,
      );
    }

    console.log(
      `[ACCOUNT FOUND] ID: ${result.value[0].accountid}, Name: ${result.value[0].name}`,
    );

    logger.info("✅ Account found", {
      institutionIdSelfcare,
      accountId: result.value[0].accountid,
      accountName: result.value[0].name,
      duration,
    });

    return result.value[0];
  } catch (error) {
    if (diagnosticSession) {
      addDiagnosticCall(diagnosticSession, {
        step: "verifyAccount",
        method: "GET",
        url,
        requestBody: null,
        responseStatus: null,
        durationMs: Date.now() - startMs,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    logger.error("❌ Failed to fetch account by Selfcare ID", error, {
      institutionIdSelfcare,
      duration: timer.elapsed(),
    });
    throw error;
  }
}

/**
 * Cerca un Ente (Account) in Dynamics tramite nome (fallback).
 *
 * Endpoint 2: GET /api/data/v9.2/accounts?$filter=contains(tolower(name), '{nome}')
 *
 * @param nomeEnte - Nome dell'ente da cercare
 * @param baseUrl - Base URL for Dynamics environment
 * @returns Account trovato o null se non esiste
 * @throws Error se trovati più enti (ambiguità)
 */
export async function getAccountByName(
  nomeEnte: string,
  baseUrl: string,
  diagnosticSession?: DiagnosticSession,
): Promise<Account | null> {
  const logger = createLogger(undefined, { nomeEnte });
  const timer = new Timer();

  logger.info("🔍 Searching account by name (fallback)", { nomeEnte });

  // Escape single quotes nel nome
  const escapedName = nomeEnte.toLowerCase().replace(/'/g, "''");

  const filter = `contains(tolower(name), '${escapedName}') and pgp_identificativoselfcare eq null`;
  const select =
    "accountid,name,pgp_identificativoselfcare,pgp_denominazioneselfcare,emailaddress1,telephone1,address1_composite,statecode";

  const url = buildUrl({
    baseUrl,
    endpoint: "/api/data/v9.2/accounts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/accounts", filter, select);

  const startMs = Date.now();
  try {
    const result = await get<Account>(url, baseUrl);
    const duration = timer.elapsed();

    if (diagnosticSession) {
      addDiagnosticCall(diagnosticSession, {
        step: "verifyAccountByName",
        method: "GET",
        url,
        requestBody: null,
        responseStatus: 200,
        durationMs: Date.now() - startMs,
      });
    }

    if (!result.value || result.value.length === 0) {
      logger.warn("⚠️ No account found by name", {
        nomeEnte,
        duration,
      });
      return null;
    }

    if (result.value.length > 1) {
      logger.error("❌ Multiple accounts found by name", undefined, {
        nomeEnte,
        count: result.value.length,
        duration,
      });
      throw new Error(
        `Ambiguità: trovati ${result.value.length} enti per nome "${nomeEnte}". Specificare institutionIdSelfcare.`,
      );
    }

    logger.info("✅ Account found by name", {
      nomeEnte,
      accountId: result.value[0].accountid,
      accountName: result.value[0].name,
      duration,
    });

    return result.value[0];
  } catch (error) {
    if (diagnosticSession) {
      addDiagnosticCall(diagnosticSession, {
        step: "verifyAccountByName",
        method: "GET",
        url,
        requestBody: null,
        responseStatus: null,
        durationMs: Date.now() - startMs,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    logger.error("❌ Failed to fetch account by name", error, {
      nomeEnte,
      duration: timer.elapsed(),
    });
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Verifica Ente (orchestratore)
// -----------------------------------------------------------------------------

export interface VerifyAccountParams {
  institutionIdSelfcare?: string;
  nomeEnte?: string;
  enableFallback: boolean;
  baseUrl: string;
  /** Sessione diagnostica opzionale per il logging su Blob Storage */
  diagnosticSession?: DiagnosticSession;
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
        params.baseUrl,
        params.diagnosticSession,
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
      const account = await getAccountByName(
        params.nomeEnte,
        params.baseUrl,
        params.diagnosticSession,
      );
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
