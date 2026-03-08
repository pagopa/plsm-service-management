import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { AuthValidateResponse } from "../_shared/types";
import {
  validateAzureAdToken,
  extractUserInfo,
} from "../_shared/utils/tokenValidator";
import { generateInternalJwt } from "../_shared/utils/jwtUtils";
import { loadConfig } from "../_shared/utils/config";

/**
 * Token Validation Endpoint Handler
 *
 * This endpoint:
 * 1. Receives an Azure AD access token from the frontend
 * 2. Validates the token using Azure AD public keys (JWKS)
 * 3. Extracts user information from the token
 * 4. Generates an internal JWT signed with our secret
 * 5. Sets the JWT as an HttpOnly cookie
 *
 * @param {HttpRequest} request - HTTP request with Azure AD token in body
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} HTTP response with JWT cookie set
 */
export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
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

    // Validate Azure AD token
    context.log("Validating Azure AD token");
    const validationResult = await validateAzureAdToken(body.accessToken);

    if (!validationResult.valid || !validationResult.payload) {
      context.warn("Token validation failed:", validationResult.error);

      const response: AuthValidateResponse = {
        success: false,
        message: validationResult.error || "Token validation failed",
      };

      return {
        status: 401,
        jsonBody: response,
      };
    }

    // Extract user info from validated token
    const userInfo = extractUserInfo(validationResult.payload);
    context.log("User authenticated:", userInfo.email);

    // Generate internal JWT
    const internalJwt = generateInternalJwt(validationResult.payload);

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
