// =============================================================================
// CONTACTS CREATE HANDLER - POST /contacts
// =============================================================================

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { verifyAccount } from "../_shared/services/accounts";
import { createContact } from "../_shared/services/contacts";
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

    // Step 1: verifica account
    const accountResult = await verifyAccount({
      institutionIdSelfcare: body.institutionIdSelfcare,
      enableFallback: false,
      baseUrl,
    });

    if (!accountResult.found || !accountResult.account) {
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

    // Step 2: crea ogni contatto
    const results: Array<{
      email: string;
      success: boolean;
      contactId?: string;
      error?: string;
    }> = [];

    for (const partecipante of body.partecipanti) {
      try {
        const contact = await createContact(baseUrl, {
          firstname: partecipante.nome,
          lastname: partecipante.cognome,
          email: partecipante.email,
          productIdSelfcare: body.productIdSelfcare,
          tipologiaReferente: partecipante.tipologiaReferente ?? "TECNICO",
          accountId,
        });

        results.push({
          email: partecipante.email,
          success: true,
          contactId: contact.contactid,
        });

        logger.info("Contact created", {
          email: partecipante.email,
          contactId: contact.contactid,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({
          email: partecipante.email,
          success: false,
          error: errorMessage,
        });
        logger.warn("Contact creation failed", {
          email: partecipante.email,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const allFailed = successCount === 0;
    const partialSuccess = successCount > 0 && successCount < results.length;

    return {
      status: allFailed ? 500 : partialSuccess ? 207 : 201,
      jsonBody: {
        success: !allFailed,
        accountId,
        results,
        created: successCount,
        total: results.length,
        timestamp: new Date().toISOString(),
      },
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
