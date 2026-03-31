import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { listContacts } from "../_shared/services/contacts";
import {
  resolveDynamicsEnvironment,
  getDynamicsBaseUrl,
  isInvalidDynamicsEnvironmentError,
} from "../_shared/utils/requestEnvironment";

export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Ping endpoint - testing Dynamics connectivity");

  try {
    // Resolve Dynamics environment from header
    const environment = resolveDynamicsEnvironment(request);
    const baseUrl = getDynamicsBaseUrl(environment);

    const result = await listContacts(baseUrl, { top: "1" });

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
    context.error("Dynamics connectivity test failed:", error);

    // Check for environment resolution errors
    if (isInvalidDynamicsEnvironmentError(error)) {
      return {
        status: 400,
        jsonBody: {
          status: "error",
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
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
