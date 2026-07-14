const DEFAULT_AUTH_REDIRECT = "/dashboard";

type AuthFunctionConfig = {
  functionBaseUrl: string;
};

type JwtValidationConfig = {
  audience: string;
  issuer: string;
  secret: string;
};

function readEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required auth environment variable: ${name}`);
  }

  return value;
}

export function getAuthConfig(): AuthFunctionConfig {
  return {
    functionBaseUrl: readEnv("AUTH_FUNCTION_BASE_URL"),
  };
}

export function getJwtValidationConfig(): JwtValidationConfig {
  const secret = readEnv("AUTH_JWT_SECRET");

  if (secret.length < 32) {
    throw new Error("AUTH_JWT_SECRET must be at least 32 characters long");
  }

  return {
    audience: readEnv("AUTH_JWT_AUDIENCE"),
    issuer: readEnv("AUTH_JWT_ISSUER"),
    secret,
  };
}

export function getDefaultAuthRedirect(): string {
  return DEFAULT_AUTH_REDIRECT;
}
