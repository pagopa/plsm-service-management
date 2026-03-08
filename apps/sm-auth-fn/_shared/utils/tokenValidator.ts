import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";
import type { AzureAdTokenPayload, TokenValidationResult } from "../types";
import { loadConfig } from "./config";

/**
 * JWKS client to fetch Azure AD public keys
 * Caches keys to avoid repeated requests
 */
let jwksClientInstance: jwksClient.JwksClient | null = null;

function getJwksClient(tenantId: string): jwksClient.JwksClient {
  if (!jwksClientInstance) {
    jwksClientInstance = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours in milliseconds
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return jwksClientInstance;
}

/**
 * Get signing key from Azure AD JWKS endpoint
 *
 * @param {string} kid - Key ID from token header
 * @param {string} tenantId - Azure AD tenant ID
 * @returns {Promise<string>} Public key for verification
 */
async function getSigningKey(kid: string, tenantId: string): Promise<string> {
  const client = getJwksClient(tenantId);
  const key = await client.getSigningKey(kid);
  return key.getPublicKey();
}

/**
 * Validate Azure AD JWT token using public keys
 *
 * This function:
 * 1. Decodes the token header to get the key ID (kid)
 * 2. Fetches the corresponding public key from Azure AD JWKS endpoint
 * 3. Verifies the token signature, expiration, and claims
 * 4. Returns the decoded payload if valid
 *
 * @param {string} token - JWT token from Azure AD
 * @returns {Promise<TokenValidationResult>} Validation result with payload or error
 */
export async function validateAzureAdToken(
  token: string,
): Promise<TokenValidationResult> {
  try {
    const config = loadConfig();

    // Decode token header to get key ID (kid)
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader || typeof decodedHeader === "string") {
      return {
        valid: false,
        error: "Invalid token format",
      };
    }

    const kid = decodedHeader.header.kid;
    if (!kid) {
      return {
        valid: false,
        error: "Token missing key ID (kid)",
      };
    }

    // Get public key from Azure AD
    const publicKey = await getSigningKey(kid, config.msalTenantId);

    // Verify token signature and claims
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      audience: config.msalClientId,
      issuer: [
        `https://login.microsoftonline.com/${config.msalTenantId}/v2.0`,
        `https://sts.windows.net/${config.msalTenantId}/`,
      ],
    }) as AzureAdTokenPayload;

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      valid: false,
      error: `Token validation failed: ${errorMessage}`,
    };
  }
}

/**
 * Extract user information from Azure AD token payload
 *
 * @param {AzureAdTokenPayload} payload - Decoded Azure AD token
 * @returns {Object} User information extracted from token
 */
export function extractUserInfo(payload: AzureAdTokenPayload) {
  return {
    userId: payload.oid || payload.sub,
    email: payload.preferred_username || payload.email || "",
    name:
      payload.name ||
      `${payload.given_name || ""} ${payload.family_name || ""}`.trim(),
    roles: payload.roles || [],
  };
}
