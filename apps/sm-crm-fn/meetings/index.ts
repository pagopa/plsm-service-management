// =============================================================================
// MEETINGS INDEX - Registrazione Azure Functions
// =============================================================================

import { HttpRequest, InvocationContext, app } from "@azure/functions";
import {
  createMeetingHandler,
  listMeetingsHandler,
  dryRunMeetingHandler,
} from "./handler";

/**
 * GET|POST /api/meetings
 *
 * Nel modello di programmazione Azure Functions Node v4 due funzioni distinte
 * che condividono la stessa `route` non generano una route multi-metodo: la
 * prima registrata "vince" e la seconda viene oscurata (404). Per questo GET e
 * POST sullo stesso path devono essere registrati in un'unica funzione che
 * smista in base al metodo HTTP.
 *
 * @param request Richiesta HTTP in ingresso.
 * @param context Contesto di invocazione della Function.
 * @returns Risposta del handler POST (creazione) o GET (lista).
 */
app.http("meetings", {
  methods: ["GET", "POST"],
  authLevel: "function",
  route: "meetings",
  handler: (request: HttpRequest, context: InvocationContext) =>
    request.method === "POST"
      ? createMeetingHandler(request, context)
      : listMeetingsHandler(request, context),
});

// POST /api/meetings/dry-run - Test senza modifiche
app.http("dryRunMeeting", {
  methods: ["POST"],
  authLevel: "function",
  route: "meetings/dry-run",
  handler: dryRunMeetingHandler,
});
