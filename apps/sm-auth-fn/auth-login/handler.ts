import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { generatePkce, createAuthUrl } from "../_shared/utils/msalClient";
import { randomBytes } from "crypto";

/**
 * Login Endpoint Handler
 *
 * This endpoint initiates the OAuth2 Authorization Code Flow with PKCE:
 * 1. Generates PKCE challenge and verifier
 * 2. Generates random state for CSRF protection
 * 3. Stores verifier and state in cookies (temporary)
 * 4. Redirects user to Azure AD for authentication
 *
 * @param {HttpRequest} request - HTTP request
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} Redirect to Azure AD
 */
export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Auth login endpoint called");

  try {
    // Generate PKCE pair
    const { verifier, challenge } = await generatePkce();
    context.log("PKCE codes generated");

    // Generate random state for CSRF protection
    const state = randomBytes(16).toString("hex");

    // Create Azure AD authorization URL
    const authUrl = await createAuthUrl(state, challenge);
    context.log("Authorization URL created:", authUrl);

    // Store PKCE verifier and state in cookies (will be needed in callback)
    const cookies = [
      `pkce_verifier=${verifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`, // 10 min
      `auth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`, // 10 min
    ];

    return {
      status: 302,
      headers: {
        Location: authUrl,
        "Set-Cookie": cookies.join(", "),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Auth login failed:", errorMessage);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: `Login initialization failed: ${errorMessage}`,
      },
    };
  }
}
