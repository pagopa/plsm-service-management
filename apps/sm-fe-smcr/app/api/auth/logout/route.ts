import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import {
  buildAuthFunctionUrl,
  buildForwardCookieHeader,
  getRequestIsSecure,
} from "@/lib/auth/proxy";

export const runtime = "nodejs";

async function notifyAuthFunction(request: NextRequest) {
  const cookieHeader = buildForwardCookieHeader(request, [AUTH_COOKIE_NAME]);

  try {
    await fetch(buildAuthFunctionUrl("/auth/logout"), {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      method: "POST",
    });
  } catch (error) {
    console.warn("[auth/logout] Auth function logout failed", error);
  }
}

export async function GET(request: NextRequest) {
  const secure = getRequestIsSecure(request);

  await notifyAuthFunction(request);

  const response = NextResponse.redirect(new URL("/", request.url));

  for (const cookieName of AUTH_COOKIE_NAMES) {
    response.cookies.set({
      httpOnly: true,
      maxAge: 0,
      name: cookieName,
      path: "/",
      sameSite: "lax",
      secure,
      value: "",
    });
  }

  return response;
}
