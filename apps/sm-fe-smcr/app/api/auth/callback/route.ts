import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_RETURN_URL_COOKIE_NAME,
  AUTH_STATE_COOKIE_NAME,
  PKCE_VERIFIER_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  applyProxyCookies,
  buildAuthFunctionUrl,
  buildForwardCookieHeader,
  getRequestIsSecure,
  sanitizeReturnUrl,
} from "@/lib/auth/proxy";

export const runtime = "nodejs";

function clearTemporaryCookies(response: NextResponse, secure: boolean) {
  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: PKCE_VERIFIER_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure,
    value: "",
  });
  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: AUTH_STATE_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure,
    value: "",
  });
  response.cookies.set({
    httpOnly: true,
    maxAge: 0,
    name: AUTH_RETURN_URL_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure,
    value: "",
  });
}

export async function GET(request: NextRequest) {
  const secure = getRequestIsSecure(request);
  const encodedReturnUrl = request.cookies.get(
    AUTH_RETURN_URL_COOKIE_NAME,
  )?.value;
  const forwardedCookies = buildForwardCookieHeader(request, [
    PKCE_VERIFIER_COOKIE_NAME,
    AUTH_STATE_COOKIE_NAME,
  ]);
  const returnUrl = sanitizeReturnUrl(
    encodedReturnUrl ? safeDecodeReturnUrl(encodedReturnUrl) : null,
  );

  if (request.nextUrl.searchParams.get("error")) {
    const errorResponse = NextResponse.redirect(
      new URL("/auth/login?error=callback", request.url),
    );
    clearTemporaryCookies(errorResponse, secure);
    return errorResponse;
  }

  try {
    const callbackUrl = buildAuthFunctionUrl("/auth/callback");
    callbackUrl.search = request.nextUrl.search;

    const authResponse = await fetch(callbackUrl, {
      cache: "no-store",
      headers: forwardedCookies ? { cookie: forwardedCookies } : undefined,
      method: "GET",
      redirect: "manual",
    });

    if (authResponse.status !== 302) {
      const responseBody = await authResponse.text().catch(() => "");
      console.error("[auth/callback] Auth function callback failed", {
        body: responseBody,
        status: authResponse.status,
      });

      throw new Error(
        `Unexpected auth callback response: ${authResponse.status}`,
      );
    }

    const response = NextResponse.redirect(new URL(returnUrl, request.url));

    applyProxyCookies(response, authResponse.headers, secure);
    response.cookies.set({
      httpOnly: true,
      maxAge: 0,
      name: AUTH_RETURN_URL_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure,
      value: "",
    });

    return response;
  } catch (error) {
    console.error("[auth/callback] Failed to complete auth flow", error);
    const errorResponse = NextResponse.redirect(
      new URL("/auth/login?error=callback", request.url),
    );
    clearTemporaryCookies(errorResponse, secure);
    return errorResponse;
  }
}

function safeDecodeReturnUrl(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return "/dashboard";
  }
}
