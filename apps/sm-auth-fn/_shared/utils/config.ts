import type { AuthConfig } from "../types";

/**
 * Load and validate environment configuration
 *
 * @returns {AuthConfig} Configuration object with all required settings
 * @throws {Error} If required environment variables are missing
 */
export function loadConfig(): AuthConfig {
  const config: AuthConfig = {
    msalClientId: process.env.MSAL_CLIENT_ID || "",
    msalTenantId: process.env.MSAL_TENANT_ID || "",
    msalRedirectUri: process.env.MSAL_REDIRECT_URI || "",
    jwtSecret: process.env.JWT_SECRET || "",
    jwtExpirySeconds: parseInt(process.env.JWT_EXPIRY_SECONDS || "3600", 10),
    jwtIssuer: process.env.JWT_ISSUER || "plsm-auth-service",
    jwtAudience: process.env.JWT_AUDIENCE || "plsm-fe-smcr",
  };

  // Validate required configuration
  const missing: string[] = [];

  if (!config.msalClientId) missing.push("MSAL_CLIENT_ID");
  if (!config.msalTenantId) missing.push("MSAL_TENANT_ID");
  if (!config.msalRedirectUri) missing.push("MSAL_REDIRECT_URI");
  if (!config.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (config.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  console.log({ config })

  return config;
}

/**
 * Check if configuration is valid without throwing errors
 *
 * @returns {boolean} True if all required config is present
 */
export function isConfigValid(): boolean {
  try {
    const c = loadConfig();

    console.log({ ENV: c })
    return true;
  } catch {
    return false;
  }
}
