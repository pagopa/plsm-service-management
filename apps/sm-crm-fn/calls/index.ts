// =============================================================================
// CALLS INDEX - Registrazione Azure Functions
// =============================================================================

import { HttpRequest, InvocationContext, app } from "@azure/functions";
import { createCallHandler, listCallsHandler } from "./handler";

/**
 * GET|POST /api/v1/calls
 *
 * Come in meetings/index.ts, GET e POST sullo stesso path vanno registrati in
 * un'unica funzione: due `app.http` sulla stessa route non generano un
 * multi-metodo, la seconda registrata oscura la prima (404).
 *
 * @param request Richiesta HTTP in ingresso.
 * @param context Contesto di invocazione della Function.
 * @returns Risposta del handler POST (registrazione) o GET (lista).
 */
app.http("calls", {
  methods: ["GET", "POST"],
  authLevel: "function",
  route: "calls",
  handler: (request: HttpRequest, context: InvocationContext) =>
    request.method === "POST"
      ? createCallHandler(request, context)
      : listCallsHandler(request, context),
});
