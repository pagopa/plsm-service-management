import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { AuthLogoutResponse } from "../_shared/types";

/**
 * Logout Endpoint Handler
 *
 * This endpoint invalidates the JWT by:
 * 1. Setting the auth-token cookie with Max-Age=0 (immediate expiration)
 * 2. Clearing the cookie value
 *
 * The client should also clear any Azure AD tokens stored in memory/sessionStorage.
 *
 * @param {HttpRequest} request - HTTP request
 * @param {InvocationContext} context - Function invocation context
 * @returns {Promise<HttpResponseInit>} HTTP response with expired cookie
 */
export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Auth logout endpoint called");

  try {
    // Clear the auth-token cookie by setting Max-Age=0
    const cookieOptions = [
      "auth-token=",
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      "Max-Age=0",
    ].join("; ");

    const response: AuthLogoutResponse = {
      success: true,
      message: "Logged out successfully",
    };

    context.log("User logged out successfully");

    return {
      status: 200,
      headers: {
        "Set-Cookie": cookieOptions,
      },
      jsonBody: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Auth logout failed:", errorMessage);

    const response: AuthLogoutResponse = {
      success: false,
      message: `Internal server error: ${errorMessage}`,
    };

    return {
      status: 500,
      jsonBody: response,
    };
  }
}
