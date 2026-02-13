// =============================================================================
// ACCOUNTS HANDLER - GET Account by Selfcare ID
// =============================================================================

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  getAccountBySelfcareId,
  getAccountByName,
} from "../_shared/services/accounts";

/**
 * Handler per GET /api/v1/accounts
 *
 * Query params:
 * - selfcareId: ID Selfcare dell'ente
 * - name: Nome dell'ente (fallback)
 *
 * @example
 * GET /api/v1/accounts?selfcareId=fce7a03b-94fe-4fa6-8dc3-10c1b4f45a76
 * GET /api/v1/accounts?name=Comune%20di%20Roma
 */
export async function getAccountHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("HTTP trigger function processed a request: GET /accounts");

  try {
    const selfcareId = request.query.get("selfcareId");
    const name = request.query.get("name");

    // Validazione input
    if (!selfcareId && !name) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message:
            "Parametro mancante: specificare 'selfcareId' o 'name' come query param",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Ricerca per Selfcare ID (priorità)
    if (selfcareId) {
      context.log(`Ricerca account per Selfcare ID: ${selfcareId}`);
      const account = await getAccountBySelfcareId(selfcareId);

      if (!account) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            message: `Ente non trovato per Selfcare ID: ${selfcareId}`,
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: account,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Ricerca per nome (fallback)
    if (name) {
      context.log(`Ricerca account per nome: ${name}`);
      const account = await getAccountByName(name);

      if (!account) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            message: `Ente non trovato per nome: ${name}`,
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: account,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Non dovrebbe mai arrivare qui
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore interno",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Errore durante la ricerca account:", error);

    // Se è un errore di ambiguità, ritorna 409
    if (errorMessage.includes("Ambiguità")) {
      return {
        status: 409,
        jsonBody: {
          success: false,
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante la ricerca dell'ente",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
