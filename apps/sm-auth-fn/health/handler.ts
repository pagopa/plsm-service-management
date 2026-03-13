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
 * This endpoint is used by Azure to determine if the function is ready to
 * receive traffic (slot swap warmup). It always returns HTTP 200 so that
 * Azure warmup probes succeed even when the configuration is incomplete;
 * the actual config validity is reported in the response body.
 *
 * @param {HttpRequest} _request - HTTP request object (unused)
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} HTTP response with health status
 */
export async function handler(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Health check endpoint called");

  try {
    const configValid = isConfigValid();

    if (!configValid) {
      context.warn(
        "Configuration validation failed — function is running but not fully configured",
      );

      const response: HealthCheckResponse = {
        status: "degraded",
        message:
          "Function is running but configuration is incomplete or invalid",
        timestamp: new Date().toISOString(),
        config: {
          jwtIssuer: process.env.JWT_ISSUER || "not-configured",
          jwtAudience: process.env.JWT_AUDIENCE || "not-configured",
          jwtExpirySeconds: (() => {
            const v = parseInt(process.env.JWT_EXPIRY_SECONDS || "", 10);
            return Number.isFinite(v) ? v : 0;
          })(),
          msalTenantConfigured: !!process.env.MSAL_TENANT_ID,
          msalClientConfigured: !!process.env.MSAL_CLIENT_ID,
          jwtSecretConfigured:
            !!process.env.JWT_SECRET && process.env.JWT_SECRET?.length >= 32,
        },
      };

      // Return 200 so Azure slot swap warmup probes always succeed.
      // The degraded status in the body signals ops that config needs attention.
      return {
        status: 200,
        jsonBody: response,
      };
    }

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
      status: "degraded",
      message:
        "Function is running but health check encountered an unexpected error",
      timestamp: new Date().toISOString(),
      config: {
        jwtIssuer: "not-available",
        jwtAudience: "not-available",
        jwtExpirySeconds: 0,
        msalTenantConfigured: false,
        msalClientConfigured: false,
        jwtSecretConfigured: false,
      },
    };

    // Return 200 so Azure slot swap warmup probes always succeed.
    return {
      status: 200,
      jsonBody: response,
    };
  }
}
