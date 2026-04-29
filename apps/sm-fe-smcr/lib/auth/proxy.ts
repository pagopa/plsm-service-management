import type { NextRequest, NextResponse } from "next/server";
import { getAuthConfig, getDefaultAuthRedirect } from "./config";

type ParsedProxyCookie = {
  httpOnly: boolean;
  maxAge?: number;
  name: string;
  path: string;
  sameSite: "lax" | "none" | "strict";
  secure: boolean;
  value: string;
};

function splitSetCookieHeader(value: string): string[] {
  const cookies: string[] = [];
  let current = "";
  let inExpires = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const maybeExpires = value.slice(index, index + 8).toLowerCase();

    if (maybeExpires === "expires=") {
      inExpires = true;
    }

    if (character === ";") {
      inExpires = false;
    }

    if (character === "," && !inExpires) {
      cookies.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    cookies.push(current.trim());
  }

  return cookies;
}

function normalizeSameSite(
  value: string | undefined,
): "lax" | "none" | "strict" {
  switch (value?.toLowerCase()) {
    case "none":
      return "none";
    case "strict":
      return "strict";
    default:
      return "lax";
  }
}

function parseProxyCookie(cookieHeader: string): ParsedProxyCookie | null {
  const parts = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  const cookiePair = parts[0];
  const attributes = parts.slice(1);

  if (!cookiePair) {
    return null;
  }

  const separatorIndex = cookiePair.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const name = cookiePair.slice(0, separatorIndex);
  const value = cookiePair.slice(separatorIndex + 1);
  let httpOnly = false;
  let maxAge: number | undefined;
  let path = "/";
  let sameSite: "lax" | "none" | "strict" = "lax";
  let secure = false;

  for (const attribute of attributes) {
    const [rawKey, ...rawValueParts] = attribute.split("=");

    if (!rawKey) {
      continue;
    }

    const key = rawKey.toLowerCase();
    const rawValue = rawValueParts.join("=");

    if (key === "httponly") {
      httpOnly = true;
      continue;
    }

    if (key === "secure") {
      secure = true;
      continue;
    }

    if (key === "path" && rawValue) {
      path = rawValue;
      continue;
    }

    if (key === "max-age" && rawValue) {
      const parsedMaxAge = Number.parseInt(rawValue, 10);
      if (Number.isFinite(parsedMaxAge)) {
        maxAge = parsedMaxAge;
      }
      continue;
    }

    if (key === "samesite") {
      sameSite = normalizeSameSite(rawValue);
    }
  }

  return {
    httpOnly,
    maxAge,
    name,
    path,
    sameSite,
    secure,
    value,
  };
}

export function getRequestIsSecure(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return (
    (forwardedProto || request.nextUrl.protocol.replace(":", "")) === "https"
  );
}

export function buildAuthFunctionUrl(pathname: string): URL {
  return new URL(`/api/v1${pathname}`, getAuthConfig().functionBaseUrl);
}

export function buildForwardCookieHeader(
  request: NextRequest,
  cookieNames: readonly string[],
): string | undefined {
  const cookies = cookieNames
    .map((cookieName) => {
      const value = request.cookies.get(cookieName)?.value;
      return value ? `${cookieName}=${value}` : null;
    })
    .filter((value): value is string => value !== null);

  if (cookies.length === 0) {
    return undefined;
  }

  return cookies.join("; ");
}

export function applyProxyCookies(
  response: NextResponse,
  headers: Headers,
  secure: boolean,
): void {
  const headersWithCookies = headers as Headers & {
    getSetCookie?: () => string[];
    raw?: () => Record<string, string[]>;
  };

  const rawCookieHeaders =
    headersWithCookies.getSetCookie?.() ||
    headersWithCookies.raw?.()["set-cookie"] ||
    [headers.get("set-cookie") || ""];
  const rawCookies = rawCookieHeaders.flatMap((rawCookieHeader) =>
    splitSetCookieHeader(rawCookieHeader),
  );

  for (const rawCookie of rawCookies) {
    const parsedCookie = parseProxyCookie(rawCookie);
    if (!parsedCookie) {
      continue;
    }

    response.cookies.set({
      httpOnly: parsedCookie.httpOnly,
      maxAge: parsedCookie.maxAge,
      name: parsedCookie.name,
      path: parsedCookie.path,
      sameSite: parsedCookie.sameSite,
      secure: secure && parsedCookie.secure,
      value: parsedCookie.value,
    });
  }
}

export function sanitizeReturnUrl(
  returnUrl: string | null | undefined,
): string {
  if (!returnUrl || !returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return getDefaultAuthRedirect();
  }

  try {
    const parsedUrl = new URL(returnUrl, "https://plsm.local");
    if (parsedUrl.origin !== "https://plsm.local") {
      return getDefaultAuthRedirect();
    }

    return (
      `${parsedUrl.pathname}${parsedUrl.search}` || getDefaultAuthRedirect()
    );
  } catch {
    return getDefaultAuthRedirect();
  }
}
