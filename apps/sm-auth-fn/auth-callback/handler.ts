import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { acquireTokenByCode } from "../_shared/utils/msalClient";
import { generateInternalJwt } from "../_shared/utils/jwtUtils";
import { loadConfig } from "../_shared/utils/config";

/**
 * Parse cookies from request header
 *
 * @param {string | undefined} cookieHeader - Cookie header value
 * @returns {Record<string, string>} Parsed cookies
 */
function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Callback Endpoint Handler
 *
 * This endpoint handles the OAuth2 redirect from Azure AD:
 * 1. Receives authorization code from Azure AD
 * 2. Validates state parameter (CSRF protection)
 * 3. Exchanges code for token using PKCE verifier
 * 4. Extracts user information from token
 * 5. Generates internal JWT
 * 6. Sets JWT as HttpOnly cookie
 * 7. Redirects user to frontend application
 *
 * @param {HttpRequest} request - HTTP request with code and state
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} Redirect to frontend with JWT cookie
 */
export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Auth callback endpoint called");

  try {
    // Extract query parameters
    const code = request.query.get("code");
    const state = request.query.get("state");
    const error = request.query.get("error");
    const errorDescription = request.query.get("error_description");

    // Handle errors from Azure AD
    if (error) {
      context.error("Azure AD returned error:", error, errorDescription);
      return {
        status: 302,
        headers: {
          Location: `/auth/error?error=${error}&description=${encodeURIComponent(errorDescription || "")}`,
        },
      };
    }

    // Validate required parameters
    if (!code || !state) {
      context.warn("Missing code or state parameter");
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Missing authorization code or state parameter",
        },
      };
    }

    // Get cookies (PKCE verifier and state)
    const cookieHeader = request.headers.get("cookie");
    const requestCookies = parseCookies(cookieHeader || undefined);
    const pkceVerifier = requestCookies["pkce_verifier"];
    const savedState = requestCookies["auth_state"];

    if (!pkceVerifier || !savedState) {
      context.warn("Missing PKCE verifier or state cookie");
      return {
        status: 400,
        jsonBody: {
          success: false,
          message:
            "Missing authentication session. Please try logging in again.",
        },
      };
    }

    // Validate state (CSRF protection)
    if (state !== savedState) {
      context.warn("State mismatch - possible CSRF attack");
      return {
        status: 403,
        jsonBody: {
          success: false,
          message: "Invalid state parameter. Possible CSRF attack.",
        },
      };
    }

    context.log("State validated successfully");

    // Exchange authorization code for token using PKCE
    const tokenResponse = await acquireTokenByCode(code, pkceVerifier);
    context.log("Token acquired successfully");

    // Extract user info from token
    const userInfo = {
      userId: tokenResponse.account?.homeAccountId || "",
      email: tokenResponse.account?.username || "",
      name: tokenResponse.account?.name || "",
      roles: (tokenResponse.idTokenClaims as any)?.roles || [],
    };

    context.log("User authenticated:", userInfo.email);

    // Generate internal JWT
    const internalJwt = generateInternalJwt({
      oid: userInfo.userId,
      preferred_username: userInfo.email,
      name: userInfo.name,
      roles: userInfo.roles,
    } as any);

    const config = loadConfig();

    // Clear temporary cookies and set JWT cookie
    const responseCookies = [
      `pkce_verifier=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`, // Clear
      `auth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`, // Clear
      `auth-token=${internalJwt}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${config.jwtExpirySeconds}`, // Set JWT
    ];

    // Redirect to frontend dashboard (or read from query param)
    const redirectUrl = request.query.get("redirect_uri") || "/dashboard";

    return {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Set-Cookie": responseCookies.join(", "),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Auth callback failed:", errorMessage);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: `Authentication failed: ${errorMessage}`,
      },
    };
  }
}
