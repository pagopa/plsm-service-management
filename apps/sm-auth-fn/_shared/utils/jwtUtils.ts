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
