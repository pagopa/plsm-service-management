export type PdndConfig = {
  readonly environment: string;
  readonly clientId: string;
  readonly clientAssertionKid: string;
  readonly clientAssertionAudience: string;
  readonly authTokenUrl: string;
  readonly apiBaseUrl: string;
  readonly clientAssertionPrivateKey: string;
  readonly dpopPrivateKey: string;
  readonly clientAssertionTtlSeconds: number;
  readonly tokenRefreshMarginSeconds: number;
  readonly requestTimeoutMs: number;
};

type PdndEnv = Record<string, string | undefined>;

const DEFAULT_CLIENT_ASSERTION_TTL_SECONDS = 600;
const DEFAULT_TOKEN_REFRESH_MARGIN_SECONDS = 60;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

function requireEnv(env: PdndEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing PDND configuration: ${key}`);
  }
  return value;
}

function parsePositiveInteger(
  env: PdndEnv,
  key: string,
  defaultValue: number,
): number {
  const rawValue = env[key]?.trim();
  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Invalid PDND configuration: ${key} must be a positive integer`,
    );
  }

  return value;
}

export function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

export function getPdndConfig(env: PdndEnv = process.env): PdndConfig {
  return {
    environment: requireEnv(env, "PDND_ENV"),
    clientId: requireEnv(env, "PDND_CLIENT_ID"),
    clientAssertionKid: requireEnv(env, "PDND_CLIENT_ASSERTION_KID"),
    clientAssertionAudience: requireEnv(env, "PDND_CLIENT_ASSERTION_AUDIENCE"),
    authTokenUrl: requireEnv(env, "PDND_AUTH_TOKEN_URL"),
    apiBaseUrl: requireEnv(env, "PDND_API_BASE_URL"),
    clientAssertionPrivateKey: normalizePem(
      requireEnv(env, "PDND_CLIENT_ASSERTION_PRIVATE_KEY"),
    ),
    dpopPrivateKey: normalizePem(requireEnv(env, "PDND_DPOP_PRIVATE_KEY")),
    clientAssertionTtlSeconds: parsePositiveInteger(
      env,
      "PDND_CLIENT_ASSERTION_TTL_SECONDS",
      DEFAULT_CLIENT_ASSERTION_TTL_SECONDS,
    ),
    tokenRefreshMarginSeconds: parsePositiveInteger(
      env,
      "PDND_TOKEN_REFRESH_MARGIN_SECONDS",
      DEFAULT_TOKEN_REFRESH_MARGIN_SECONDS,
    ),
    requestTimeoutMs: parsePositiveInteger(
      env,
      "PDND_REQUEST_TIMEOUT_MS",
      DEFAULT_REQUEST_TIMEOUT_MS,
    ),
  };
}
