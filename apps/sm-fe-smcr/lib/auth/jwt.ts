import { getJwtValidationConfig } from "./config";

export type AuthSession = {
  aud: string;
  email: string;
  exp: number;
  iat: number;
  iss: string;
  name: string;
  roles: string[];
  userId: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function decodeBase64Url(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isValidSession(payload: unknown): payload is AuthSession {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return (
    typeof candidate.userId === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    isStringArray(candidate.roles) &&
    typeof candidate.iss === "string" &&
    typeof candidate.aud === "string" &&
    typeof candidate.exp === "number" &&
    typeof candidate.iat === "number"
  );
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftByte = left[index];
    const rightByte = right[index];

    if (leftByte === undefined || rightByte === undefined) {
      return false;
    }

    mismatch |= leftByte ^ rightByte;
  }

  return mismatch === 0;
}

async function signHs256(input: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      hash: "SHA-256",
      name: "HMAC",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(input),
  );
  return new Uint8Array(signature);
}

export async function verifyAuthToken(
  token: string | undefined,
): Promise<AuthSession | null> {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const encodedHeader = parts[0];
  const encodedPayload = parts[1];
  const encodedSignature = parts[2];

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  const header = parseJson<Record<string, unknown>>(
    decoder.decode(decodeBase64Url(encodedHeader)),
  );

  if (!header || header.alg !== "HS256") {
    return null;
  }

  const config = getJwtValidationConfig();
  const expectedSignature = await signHs256(
    `${encodedHeader}.${encodedPayload}`,
    config.secret,
  );
  const actualSignature = decodeBase64Url(encodedSignature);

  if (!constantTimeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  const payload = parseJson<unknown>(
    decoder.decode(decodeBase64Url(encodedPayload)),
  );

  if (!isValidSession(payload)) {
    return null;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (
    payload.iss !== config.issuer ||
    payload.aud !== config.audience ||
    payload.exp <= nowInSeconds
  ) {
    return null;
  }

  return payload;
}
