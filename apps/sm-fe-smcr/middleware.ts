import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyAuthToken } from "@/lib/auth/jwt";

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL("/api/auth/login", request.url);
  const returnUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.searchParams.set("returnUrl", returnUrl);
  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifyAuthToken(token);

  if (session) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(buildLoginRedirect(request));
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: "/dashboard/:path*",
};
