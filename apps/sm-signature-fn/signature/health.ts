import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

export async function health(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Health check endpoint was triggered for warm-up.");
  return { body: "OK" };
}
