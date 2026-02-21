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
import { createLogger } from "../_shared/utils/logger";

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
  const logger = createLogger(context);
  logger.info("HTTP GET /contacts request received");

  try {
    const accountId = request.query.get("accountId");
    const contactId = request.query.get("contactId");

    logger.debug("Query parameters", {
      accountId: accountId ?? undefined,
      contactId: contactId ?? undefined,
    });

    // Validazione input
    if (!accountId && !contactId) {
      logger.warn("Missing required query parameter", {
        hasAccountId: false,
        hasContactId: false,
      });

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
      logger.warn("Both accountId and contactId provided", {
        accountId,
        contactId,
      });

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
      logger.info("Searching contact by ID", { contactId });
      const contact = await getContactById(contactId);

      if (!contact) {
        logger.warn("Contact not found", { contactId });

        return {
          status: 404,
          jsonBody: {
            success: false,
            message: `Contatto non trovato per ID: ${contactId}`,
            timestamp: new Date().toISOString(),
          },
        };
      }

      logger.info("Contact found by ID", {
        contactId: contact.contactid,
        email: contact.emailaddress1,
      });

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
      logger.info("Searching contacts by Account ID", { accountId });
      const result = await getContactsByAccountId(accountId);

      const count = result.value?.length ?? 0;

      logger.info("Contacts search completed", {
        accountId,
        count,
      });

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: result.value ?? [],
          count,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Non dovrebbe mai arrivare qui
    logger.error("Unexpected code path reached", undefined, {
      accountId: accountId ?? undefined,
      contactId: contactId ?? undefined,
    });

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
    logger.error("Unexpected error in getContactsHandler", error);

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
