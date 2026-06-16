import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_RETURN_URL_COOKIE_NAME,
} from "@/lib/auth/constants";
import { verifyAuthToken } from "@/lib/auth/jwt";
import {
  applyProxyCookies,
  buildAuthFunctionUrl,
  getPublicOrigin,
  getRequestIsSecure,
  sanitizeReturnUrl,
} from "@/lib/auth/proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const returnUrl = sanitizeReturnUrl(
    request.nextUrl.searchParams.get("returnUrl"),
  );
  const session = await verifyAuthToken(
    request.cookies.get(AUTH_COOKIE_NAME)?.value,
  );

  if (session) {
    return NextResponse.redirect(
      new URL(returnUrl, getPublicOrigin(request)),
    );
  }

  try {
    const authResponse = await fetch(buildAuthFunctionUrl("/auth/login"), {
      cache: "no-store",
      method: "GET",
      redirect: "manual",
    });
    const authLocation = authResponse.headers.get("location");

    if (authResponse.status !== 302 || !authLocation) {
      throw new Error(`Unexpected auth login response: ${authResponse.status}`);
    }

    const response = NextResponse.redirect(authLocation);
    const secure = getRequestIsSecure(request);

    applyProxyCookies(response, authResponse.headers, secure);
    response.cookies.set({
      httpOnly: true,
      maxAge: 600,
      name: AUTH_RETURN_URL_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure,
      value: encodeURIComponent(returnUrl),
    });

    return response;
  } catch (error) {
    console.error("[auth/login] Failed to initiate auth flow", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=unavailable", getPublicOrigin(request)),
    );
  }
}
