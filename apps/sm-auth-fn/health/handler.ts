import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { HealthCheckResponse } from "../_shared/types";
import { isConfigValid, loadConfig } from "../_shared/utils/config";

/**
 * Health Check Endpoint Handler
 *
 * Returns the health status of the Auth Function.
 * Verifies that all required configuration is present.
 *
 * This endpoint is used by Azure to determine if the function is ready to receive traffic.
 *
 * @param {HttpRequest} request - HTTP request object
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} HTTP response with health status
 */
export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Health check endpoint called");

  try {
    // Check if configuration is valid
    const configValid = isConfigValid();

    if (!configValid) {
      context.error("Configuration validation failed");

      const response: HealthCheckResponse = {
        status: "unhealthy",
        message: "Configuration is incomplete or invalid",
        timestamp: new Date().toISOString(),
        config: {
          jwtIssuer: process.env.JWT_ISSUER || "not-configured",
          jwtAudience: process.env.JWT_AUDIENCE || "not-configured",
          jwtExpirySeconds: parseInt(process.env.JWT_EXPIRY_SECONDS || "0", 10),
          msalTenantConfigured: !!process.env.MSAL_TENANT_ID,
          msalClientConfigured: !!process.env.MSAL_CLIENT_ID,
          jwtSecretConfigured:
            !!process.env.JWT_SECRET && process.env.JWT_SECRET?.length >= 32,
        },
      };

      return {
        status: 503,
        jsonBody: response,
      };
    }

    // Configuration is valid
    const config = loadConfig();

    const response: HealthCheckResponse = {
      status: "healthy",
      message: "Auth Function is running and properly configured",
      timestamp: new Date().toISOString(),
      config: {
        jwtIssuer: config.jwtIssuer,
        jwtAudience: config.jwtAudience,
        jwtExpirySeconds: config.jwtExpirySeconds,
        msalTenantConfigured: true,
        msalClientConfigured: true,
        jwtSecretConfigured: true,
      },
    };

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Health check failed:", errorMessage);

    const response: HealthCheckResponse = {
      status: "unhealthy",
      message: `Health check failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
      config: {
        jwtIssuer: "error",
        jwtAudience: "error",
        jwtExpirySeconds: 0,
        msalTenantConfigured: false,
        msalClientConfigured: false,
        jwtSecretConfigured: false,
      },
    };

    return {
      status: 503,
      jsonBody: response,
    };
  }
}
