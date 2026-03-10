import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { AuthRefreshResponse } from "../_shared/types";
import { refreshInternalJwt } from "../_shared/utils/jwtUtils";
import { loadConfig } from "../_shared/utils/config";

/**
 * Token Refresh Endpoint Handler
 *
 * This endpoint:
 * 1. Reads the current JWT from the HttpOnly cookie
 * 2. Validates the JWT
 * 3. Issues a new JWT with extended expiry
 * 4. Sets the new JWT as an HttpOnly cookie
 *
 * This allows session extension without re-authenticating with Azure AD.
 *
 * @param {HttpRequest} request - HTTP request with auth-token cookie
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} HTTP response with new JWT cookie
 */
export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Auth refresh endpoint called");

  try {
    // Extract JWT from cookie
    const cookies = request.headers.get("cookie") || "";
    const authTokenMatch = cookies.match(/auth-token=([^;]+)/);

    if (!authTokenMatch) {
      context.warn("Missing auth-token cookie");

      const response: AuthRefreshResponse = {
        success: false,
        message: "Missing authentication token",
      };

      return {
        status: 401,
        jsonBody: response,
      };
    }

    const currentToken = authTokenMatch[1];

    // Refresh the token
    const newToken = refreshInternalJwt(currentToken);

    if (!newToken) {
      context.warn("Token refresh failed - invalid or expired token");

      const response: AuthRefreshResponse = {
        success: false,
        message: "Invalid or expired token",
      };

      return {
        status: 401,
        jsonBody: response,
      };
    }

    context.log("Token refreshed successfully");

    const config = loadConfig();

    // Set new JWT as HttpOnly cookie
    const cookieOptions = [
      `auth-token=${newToken}`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${config.jwtExpirySeconds}`,
    ].join("; ");

    const response: AuthRefreshResponse = {
      success: true,
      message: "Token refreshed successfully",
    };

    return {
      status: 200,
      headers: {
        "Set-Cookie": cookieOptions,
      },
      jsonBody: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Auth refresh failed:", errorMessage);

    const response: AuthRefreshResponse = {
      success: false,
      message: `Internal server error: ${errorMessage}`,
    };

    return {
      status: 500,
      jsonBody: response,
    };
  }
}
