// =============================================================================
// CONTACTS INDEX - Azure Function Definition
// =============================================================================

import { HttpRequest, InvocationContext, app } from "@azure/functions";
import { getContactsHandler } from "./handler";
import { createContactsHandler } from "./createHandler";

/**
 * GET|POST /api/contacts
 *
 * Nel modello di programmazione Azure Functions Node v4 due funzioni distinte
 * che condividono la stessa `route` non generano una route multi-metodo: la
 * prima registrata "vince" e la seconda viene oscurata (404). Per questo GET e
 * POST sullo stesso path devono essere registrati in un'unica funzione che
 * smista in base al metodo HTTP.
 *
 * @param request Richiesta HTTP in ingresso.
 * @param context Contesto di invocazione della Function.
 * @returns Risposta del handler POST (creazione) o GET (lettura).
 */
app.http("contacts", {
  methods: ["GET", "POST"],
  authLevel: "function",
  route: "contacts",
  handler: (request: HttpRequest, context: InvocationContext) =>
    request.method === "POST"
      ? createContactsHandler(request, context)
      : getContactsHandler(request, context),
});
