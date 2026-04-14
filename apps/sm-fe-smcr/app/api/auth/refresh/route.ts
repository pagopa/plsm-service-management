import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import {
  applyProxyCookies,
  buildAuthFunctionUrl,
  buildForwardCookieHeader,
  getRequestIsSecure,
} from "@/lib/auth/proxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const cookieHeader = buildForwardCookieHeader(request, [AUTH_COOKIE_NAME]);
  const secure = getRequestIsSecure(request);

  if (!cookieHeader) {
    return NextResponse.json(
      { message: "Missing authentication token", success: false },
      { status: 401 },
    );
  }

  try {
    const authResponse = await fetch(buildAuthFunctionUrl("/auth/refresh"), {
      cache: "no-store",
      headers: { cookie: cookieHeader },
      method: "POST",
      redirect: "manual",
    });

    const payload = await authResponse.json().catch(() => ({
      message: "Unable to refresh token",
      success: false,
    }));

    const response = NextResponse.json(payload, {
      status: authResponse.status,
    });
    applyProxyCookies(response, authResponse.headers, secure);

    if (authResponse.status === 401) {
      response.cookies.set({
        httpOnly: true,
        maxAge: 0,
        name: AUTH_COOKIE_NAME,
        path: "/",
        sameSite: "strict",
        secure,
        value: "",
      });
    }

    return response;
  } catch (error) {
    console.error("[auth/refresh] Failed to refresh auth token", error);
    return NextResponse.json(
      { message: "Unable to refresh token", success: false },
      { status: 502 },
    );
  }
}
