// =============================================================================
// CONTACTS CREATE HANDLER - POST /contacts
//
// Flusso per ogni partecipante:
//   Step 1 — cerca per istituzione + email + prodotto (Selfcare ID)
//   Step 2 — cerca per email + prodotto (GUID CRM)
//   Step 3 — cerca per sola email
//   → se trovato: 409 con dati contatto esistente
//   → se non trovato: crea → 201
//
// Ogni passo è loggato su Blob Storage via DiagnosticSession (feature flag).
// =============================================================================

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { verifyAccount } from "../_shared/services/accounts";
import {
  getContactByEmailAndInstitution,
  getContactByEmailAndProduct,
  getContactByEmailOnly,
  createContact,
} from "../_shared/services/contacts";
import { buildUrl } from "../_shared/services/httpClient";
import { createLogger } from "../_shared/utils/logger";
import type {
  ProductIdSelfcare,
  TipologiaReferente,
} from "../_shared/types/dynamics";
import {
  resolveDynamicsEnvironment,
  getDynamicsBaseUrl,
  isInvalidDynamicsEnvironmentError,
} from "../_shared/utils/requestEnvironment";
import {
  createDiagnosticSession,
  writeDiagnosticBlob,
  isDiagnosticEnabled,
  addDiagnosticCall,
  type DiagnosticSession,
} from "../_shared/services/diagnosticLogger";
import { resolveEnvironment, getProductGuid } from "../_shared/utils/mappings";

// -----------------------------------------------------------------------------
// Tipi request body
// -----------------------------------------------------------------------------

interface CreateContactsRequestBody {
  institutionIdSelfcare: string;
  productIdSelfcare: ProductIdSelfcare;
  partecipanti: Array<{
    email: string;
    nome: string;
    cognome: string;
    tipologiaReferente?: TipologiaReferente;
  }>;
}

function isValidBody(body: unknown): body is CreateContactsRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b["institutionIdSelfcare"] !== "string") return false;
  if (typeof b["productIdSelfcare"] !== "string") return false;
  if (!Array.isArray(b["partecipanti"]) || b["partecipanti"].length === 0)
    return false;
  for (const p of b["partecipanti"] as unknown[]) {
    if (!p || typeof p !== "object") return false;
    const part = p as Record<string, unknown>;
    if (typeof part["email"] !== "string") return false;
    if (typeof part["nome"] !== "string") return false;
    if (typeof part["cognome"] !== "string") return false;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Helper: cascata ricerca contatto (3 step) con diagnostic logging
// -----------------------------------------------------------------------------

interface ContactSearchResult {
  found: boolean;
  contact: import("../_shared/types/dynamics").Contact | null;
  foundByStep?: 1 | 2 | 3;
}

async function searchContactCascade(
  baseUrl: string,
  email: string,
  institutionIdSelfcare: string,
  productIdSelfcare: ProductIdSelfcare,
  diagnosticSession: DiagnosticSession | undefined,
): Promise<ContactSearchResult> {
  const environment = resolveEnvironment(baseUrl);
  const productGuid = getProductGuid(productIdSelfcare, environment);

  // -------------------------------------------------------------------------
  // Step 1: istituzione + email + prodotto (Selfcare ID)
  // -------------------------------------------------------------------------
  {
    const step1Url = buildUrl({
      baseUrl,
      endpoint: "/api/data/v9.2/contacts",
      filter: `pgp_identificativoselfcarecliente eq '${institutionIdSelfcare}' and emailaddress1 eq '${email.replace(/'/g, "''")}' and contains(pgp_identificativoidpagopa, '${productIdSelfcare}')`,
      select:
        "contactid,fullname,emailaddress1,firstname,lastname,telephone1,pgp_identificativoselfcarecliente,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente",
    });
    const t0 = Date.now();

    try {
      const contact = await getContactByEmailAndInstitution(
        baseUrl,
        email,
        institutionIdSelfcare,
        productIdSelfcare,
      );
      const durationMs = Date.now() - t0;

      if (diagnosticSession) {
        addDiagnosticCall(diagnosticSession, {
          step: "POST/contacts — step1 searchByInstitution",
          method: "GET",
          url: step1Url,
          requestBody: null,
          responseStatus: 200,
          durationMs,
        });
      }

      if (contact) {
        return { found: true, contact, foundByStep: 1 };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (diagnosticSession) {
        addDiagnosticCall(diagnosticSession, {
          step: "POST/contacts — step1 searchByInstitution",
          method: "GET",
          url: step1Url,
          requestBody: null,
          responseStatus: null,
          durationMs: Date.now() - t0,
          error: msg,
        });
      }
      // non blocchiamo: proviamo step successivo
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: email + prodotto (GUID CRM)
  // -------------------------------------------------------------------------
  if (productGuid) {
    const step2Url = buildUrl({
      baseUrl,
      endpoint: "/api/data/v9.2/contacts",
      filter: `emailaddress1 eq '${email.replace(/'/g, "''")}' and _pgp_prodottoid_value eq '${productGuid}'`,
      select:
        "contactid,fullname,emailaddress1,firstname,lastname,telephone1,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente",
    });
    const t0 = Date.now();

    try {
      const contact = await getContactByEmailAndProduct(
        baseUrl,
        email,
        productGuid,
      );
      const durationMs = Date.now() - t0;

      if (diagnosticSession) {
        addDiagnosticCall(diagnosticSession, {
          step: "POST/contacts — step2 searchByEmailAndProduct",
          method: "GET",
          url: step2Url,
          requestBody: null,
          responseStatus: 200,
          durationMs,
        });
      }

      if (contact) {
        return { found: true, contact, foundByStep: 2 };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (diagnosticSession) {
        addDiagnosticCall(diagnosticSession, {
          step: "POST/contacts — step2 searchByEmailAndProduct",
          method: "GET",
          url: step2Url,
          requestBody: null,
          responseStatus: null,
          durationMs: Date.now() - t0,
          error: msg,
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: solo email
  // -------------------------------------------------------------------------
  {
    const step3Url = buildUrl({
      baseUrl,
      endpoint: "/api/data/v9.2/contacts",
      filter: `emailaddress1 eq '${email.replace(/'/g, "''")}'`,
      select:
        "contactid,fullname,emailaddress1,firstname,lastname,telephone1,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente",
    });
    const t0 = Date.now();

    try {
      const contact = await getContactByEmailOnly(baseUrl, email);
      const durationMs = Date.now() - t0;

      if (diagnosticSession) {
        addDiagnosticCall(diagnosticSession, {
          step: "POST/contacts — step3 searchByEmailOnly",
          method: "GET",
          url: step3Url,
          requestBody: null,
          responseStatus: 200,
          durationMs,
        });
      }

      if (contact) {
        return { found: true, contact, foundByStep: 3 };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (diagnosticSession) {
        addDiagnosticCall(diagnosticSession, {
          step: "POST/contacts — step3 searchByEmailOnly",
          method: "GET",
          url: step3Url,
          requestBody: null,
          responseStatus: null,
          durationMs: Date.now() - t0,
          error: msg,
        });
      }
    }
  }

  return { found: false, contact: null };
}

// -----------------------------------------------------------------------------
// POST /contacts
// -----------------------------------------------------------------------------

/**
 * Handler per POST /api/v1/contacts
 *
 * Per ogni partecipante esegue una cascata di ricerca (3 step).
 * Se trovato → 409 con dati contatto esistente (il frontend può proporre "usa questo").
 * Se non trovato → crea il contatto → 201.
 *
 * Ogni passo (ricerca + creazione) viene loggato su Blob Storage
 * tramite DiagnosticSession se DIAGNOSTIC_LOGGING_ENABLED=true.
 *
 * @example
 * POST /api/v1/contacts
 * {
 *   "institutionIdSelfcare": "uuid-ente",
 *   "productIdSelfcare": "prod-pagopa",
 *   "partecipanti": [{ "email": "mario@ente.it", "nome": "Mario", "cognome": "Rossi" }]
 * }
 */
export async function createContactsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createLogger(context);
  logger.info("HTTP POST /contacts request received");

  try {
    // Resolve Dynamics environment from header
    const environment = resolveDynamicsEnvironment(request);
    const baseUrl = getDynamicsBaseUrl(environment);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Body non valido: JSON malformato",
          timestamp: new Date().toISOString(),
        },
      };
    }

    if (!isValidBody(body)) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message:
            "Parametri mancanti: institutionIdSelfcare, productIdSelfcare e partecipanti (con email, nome, cognome) sono obbligatori",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // -------------------------------------------------------------------------
    // Avvia sessione diagnostica (feature flag)
    // -------------------------------------------------------------------------
    const diagnosticEnabled = isDiagnosticEnabled();
    const crmEnvironment = resolveEnvironment(baseUrl);
    const diagnosticSession: DiagnosticSession | undefined = diagnosticEnabled
      ? createDiagnosticSession(body, crmEnvironment)
      : undefined;

    // -------------------------------------------------------------------------
    // Step 0: verifica account
    // -------------------------------------------------------------------------
    const t0Account = Date.now();
    const accountResult = await verifyAccount({
      institutionIdSelfcare: body.institutionIdSelfcare,
      enableFallback: false,
      baseUrl,
      diagnosticSession,
    });

    if (diagnosticSession && !accountResult.found) {
      // verifyAccount già logga internamente; aggiungiamo un marker esplicito
      addDiagnosticCall(diagnosticSession, {
        step: "POST/contacts — verifyAccount",
        method: "GET",
        url: `${baseUrl}/api/data/v9.2/accounts?$filter=pgp_identificativoselfcarecliente eq '${body.institutionIdSelfcare}'`,
        requestBody: null,
        responseStatus: 404,
        durationMs: Date.now() - t0Account,
        error: accountResult.error,
      });
    }

    if (!accountResult.found || !accountResult.account) {
      if (diagnosticSession) {
        diagnosticSession.orchestratorResult = {
          success: false,
          error: accountResult.error ?? "Ente non trovato",
        };
        void writeDiagnosticBlob(diagnosticSession);
      }
      return {
        status: 404,
        jsonBody: {
          success: false,
          message: accountResult.error ?? "Ente non trovato",
          timestamp: new Date().toISOString(),
        },
      };
    }

    const accountId = accountResult.account.accountid;
    logger.info("Account verificato", {
      accountId,
      institutionIdSelfcare: body.institutionIdSelfcare,
    });

    // -------------------------------------------------------------------------
    // Per ogni partecipante: cascata ricerca → 409 se trovato, crea se no
    // -------------------------------------------------------------------------
    const results: Array<{
      email: string;
      status: "created" | "alreadyExists" | "error";
      contactId?: string;
      contact?: unknown;
      foundByStep?: number;
      error?: string;
    }> = [];

    for (const partecipante of body.partecipanti) {
      logger.info("Processing partecipante", { email: partecipante.email });

      // Cascata ricerca
      const searchResult = await searchContactCascade(
        baseUrl,
        partecipante.email,
        body.institutionIdSelfcare,
        body.productIdSelfcare,
        diagnosticSession,
      );

      if (searchResult.found && searchResult.contact) {
        // Contatto già esistente → restituisci 409
        logger.info("Contact already exists", {
          email: partecipante.email,
          contactId: searchResult.contact.contactid,
          foundByStep: searchResult.foundByStep,
        });

        results.push({
          email: partecipante.email,
          status: "alreadyExists",
          contactId: searchResult.contact.contactid,
          contact: searchResult.contact,
          foundByStep: searchResult.foundByStep,
        });

        continue;
      }

      // Non trovato → crea
      const createStart = Date.now();
      try {
        const tipologiaReferente = partecipante.tipologiaReferente ?? "TECNICO";
        const newContact = await createContact(baseUrl, {
          firstname: partecipante.nome,
          lastname: partecipante.cognome,
          email: partecipante.email,
          productIdSelfcare: body.productIdSelfcare,
          tipologiaReferente,
          accountId,
        });

        if (diagnosticSession) {
          const env = resolveEnvironment(baseUrl);
          const prodGuid = getProductGuid(body.productIdSelfcare, env);
          addDiagnosticCall(diagnosticSession, {
            step: "POST/contacts — createContact",
            method: "POST",
            url: `${baseUrl}/api/data/v9.2/contacts`,
            requestBody: {
              firstname: partecipante.nome,
              lastname: partecipante.cognome,
              emailaddress1: partecipante.email,
              "parentcustomerid_account@odata.bind": `/accounts(${accountId})`,
              ...(prodGuid
                ? { "pgp_Prodottoid@odata.bind": `/products(${prodGuid})` }
                : {}),
            },
            responseStatus: 201,
            durationMs: Date.now() - createStart,
          });
        }

        logger.info("Contact created", {
          email: partecipante.email,
          contactId: newContact.contactid,
        });

        results.push({
          email: partecipante.email,
          status: "created",
          contactId: newContact.contactid,
          contact: newContact,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (diagnosticSession) {
          addDiagnosticCall(diagnosticSession, {
            step: "POST/contacts — createContact",
            method: "POST",
            url: `${baseUrl}/api/data/v9.2/contacts`,
            requestBody: null,
            responseStatus: null,
            durationMs: Date.now() - createStart,
            error: errorMessage,
          });
        }

        logger.warn("Contact creation failed", {
          email: partecipante.email,
          error: errorMessage,
        });

        results.push({
          email: partecipante.email,
          status: "error",
          error: errorMessage,
        });
      }
    }

    // -------------------------------------------------------------------------
    // Determina HTTP status e scrivi blob diagnostico
    // -------------------------------------------------------------------------
    const created = results.filter((r) => r.status === "created").length;
    const alreadyExists = results.filter(
      (r) => r.status === "alreadyExists",
    ).length;
    const errors = results.filter((r) => r.status === "error").length;

    // 409 se TUTTI sono già esistenti, 207 se mix, 500 se tutti in errore, 201 altrimenti
    let httpStatus: number;
    if (errors > 0 && created === 0 && alreadyExists === 0) {
      httpStatus = 500;
    } else if (alreadyExists > 0 && created === 0 && errors === 0) {
      httpStatus = 409;
    } else if (alreadyExists > 0 || errors > 0) {
      httpStatus = 207;
    } else {
      httpStatus = 201;
    }

    const responseBody = {
      success: errors === 0,
      accountId,
      results,
      created,
      alreadyExists,
      errors,
      total: results.length,
      timestamp: new Date().toISOString(),
    };

    if (diagnosticSession) {
      diagnosticSession.orchestratorResult = responseBody;
      void writeDiagnosticBlob(diagnosticSession);
    }

    return {
      status: httpStatus,
      jsonBody: responseBody,
    };
  } catch (error) {
    logger.error("Unexpected error in createContactsHandler", error);

    // Check for environment resolution errors
    if (isInvalidDynamicsEnvironmentError(error)) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante la creazione dei contatti",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
