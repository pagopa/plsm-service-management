import jwt from "jsonwebtoken";
import type { InternalJwtPayload, AzureAdTokenPayload } from "../types";
import { loadConfig } from "./config";

/**
 * Generate internal JWT token for Next.js application
 *
 * This JWT is signed with our own secret and will be used
 * by the Next.js middleware to validate authenticated requests.
 *
 * @param {AzureAdTokenPayload} azureAdPayload - Validated Azure AD token payload
 * @returns {string} Signed JWT token
 */
export function generateInternalJwt(
  azureAdPayload: AzureAdTokenPayload,
): string {
  const config = loadConfig();

  const payload: InternalJwtPayload = {
    userId: azureAdPayload.oid || azureAdPayload.sub,
    email: azureAdPayload.preferred_username || azureAdPayload.email || "",
    name: azureAdPayload.name,
    roles: azureAdPayload.roles,
    iss: config.jwtIssuer,
    aud: config.jwtAudience,
    exp: Math.floor(Date.now() / 1000) + config.jwtExpirySeconds,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, config.jwtSecret, {
    algorithm: "HS256",
  });
}

/**
 * Verify and decode internal JWT token
 *
 * @param {string} token - JWT token to verify
 * @returns {InternalJwtPayload | null} Decoded payload if valid, null otherwise
 */
export function verifyInternalJwt(token: string): InternalJwtPayload | null {
  try {
    const config = loadConfig();

    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ["HS256"],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }) as InternalJwtPayload;

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh internal JWT token
 *
 * Takes an existing valid JWT and issues a new one with extended expiry.
 * This allows for session extension without requiring re-authentication with Azure AD.
 *
 * @param {string} token - Current JWT token
 * @returns {string | null} New JWT token if current one is valid, null otherwise
 */
export function refreshInternalJwt(token: string): string | null {
  const decoded = verifyInternalJwt(token);

  if (!decoded) {
    return null;
  }

  const config = loadConfig();

  // Create new token with same user info but new expiry
  const newPayload: InternalJwtPayload = {
    userId: decoded.userId,
    email: decoded.email,
    name: decoded.name,
    roles: decoded.roles,
    iss: config.jwtIssuer,
    aud: config.jwtAudience,
    exp: Math.floor(Date.now() / 1000) + config.jwtExpirySeconds,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(newPayload, config.jwtSecret, {
    algorithm: "HS256",
  });
}
