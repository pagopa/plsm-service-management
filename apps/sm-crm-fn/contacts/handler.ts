// =============================================================================
// CONTACTS HANDLER - GET Contacts by Account or by ID
// =============================================================================

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  getContactsByAccountId,
  getContactById,
} from "../_shared/services/contacts";

/**
 * Handler per GET /api/v1/contacts
 *
 * Query params:
 * - accountId: GUID dell'account (ente) per ottenere tutti i suoi contatti
 * - contactId: GUID del contatto per ottenere un singolo contatto
 *
 * @example
 * GET /api/v1/contacts?accountId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * GET /api/v1/contacts?contactId=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
 */
export async function getContactsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("HTTP trigger function processed a request: GET /contacts");

  try {
    const accountId = request.query.get("accountId");
    const contactId = request.query.get("contactId");

    // Validazione input
    if (!accountId && !contactId) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message:
            "Parametro mancante: specificare 'accountId' o 'contactId' come query param",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Se entrambi sono specificati, ritorna errore
    if (accountId && contactId) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message:
            "Specificare solo uno tra 'accountId' e 'contactId', non entrambi",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Ricerca per Contact ID (singolo contatto)
    if (contactId) {
      context.log(`Ricerca contatto per ID: ${contactId}`);
      const contact = await getContactById(contactId);

      if (!contact) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            message: `Contatto non trovato per ID: ${contactId}`,
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: contact,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Ricerca per Account ID (lista contatti dell'ente)
    if (accountId) {
      context.log(`Ricerca contatti per Account ID: ${accountId}`);
      const result = await getContactsByAccountId(accountId);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: result.value ?? [],
          count: result.value?.length ?? 0,
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
    context.error("Errore durante la ricerca contatti:", error);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante la ricerca dei contatti",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
