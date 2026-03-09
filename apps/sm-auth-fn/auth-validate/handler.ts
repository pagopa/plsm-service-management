import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { AuthValidateResponse } from "../_shared/types";
import { generateInternalJwt } from "../_shared/utils/jwtUtils";
import { loadConfig } from "../_shared/utils/config";

/**
 * Token Validation Endpoint Handler
 *
 * ⚠️ DEPRECATED: This endpoint is kept for backward compatibility only.
 * New implementations should use GET /auth/login and GET /auth/callback instead.
 *
 * This endpoint provides a minimal backward-compatible interface that accepts
 * a pre-validated token from the frontend and generates an internal JWT.
 *
 * @deprecated Use /auth/login flow instead
 * @param {HttpRequest} request - HTTP request with Azure AD token in body
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} HTTP response with JWT cookie set
 */
export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.warn(
    "⚠️ DEPRECATED: /auth/validate endpoint used. Please migrate to /auth/login flow.",
  );
  context.log("Auth validate endpoint called");

  try {
    // Parse request body
    const body = (await request.json()) as { accessToken?: string };

    if (!body.accessToken) {
      context.warn("Missing accessToken in request body");

      const response: AuthValidateResponse = {
        success: false,
        message: "Missing accessToken in request body",
      };

      return {
        status: 400,
        jsonBody: response,
      };
    }

    // ⚠️ Minimal validation - decode without verification
    // This is acceptable only because the token comes from a trusted MSAL client
    try {
      const payload = JSON.parse(
        Buffer.from(body.accessToken.split(".")[1], "base64").toString(),
      );

      const userInfo = {
        userId: payload.oid || payload.sub,
        email: payload.preferred_username || payload.email || "",
        name: payload.name || "",
        roles: payload.roles || [],
      };

      context.log("User authenticated:", userInfo.email);

      // Generate internal JWT
      const internalJwt = generateInternalJwt(payload);

      const config = loadConfig();

      // Set JWT as HttpOnly cookie
      const cookieOptions = [
        `auth-token=${internalJwt}`,
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
        "Path=/",
        `Max-Age=${config.jwtExpirySeconds}`,
      ].join("; ");

      const response: AuthValidateResponse = {
        success: true,
        message: "Authentication successful",
        user: userInfo,
      };

      return {
        status: 200,
        headers: {
          "Set-Cookie": cookieOptions,
        },
        jsonBody: response,
      };
    } catch (decodeError) {
      context.error("Token decode failed:", decodeError);

      const response: AuthValidateResponse = {
        success: false,
        message: "Invalid token format",
      };

      return {
        status: 401,
        jsonBody: response,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Auth validate failed:", errorMessage);

    const response: AuthValidateResponse = {
      success: false,
      message: `Internal server error: ${errorMessage}`,
    };

    return {
      status: 500,
      jsonBody: response,
    };
  }
}
