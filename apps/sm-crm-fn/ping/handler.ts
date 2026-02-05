import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { listContacts } from "../_shared/services/contacts";

export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Ping endpoint - testing Dynamics connectivity");

  try {
    const result = await listContacts({ top: "1" });

    return {
      status: 200,
      jsonBody: {
        status: "connected",
        message: "Successfully connected to Dynamics CRM",
        timestamp: new Date().toISOString(),
        contactsFound: result.value?.length ?? 0,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Dynamics connectivity test failed:", errorMessage);

    return {
      status: 503,
      jsonBody: {
        status: "error",
        message: "Failed to connect to Dynamics CRM",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
