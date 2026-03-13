import { PublicClientApplication, CryptoProvider } from "@azure/msal-node";
import type { AuthConfig } from "../types";
import { loadConfig } from "./config";

/**
 * Singleton MSAL Public Client instance
 */
let msalInstance: PublicClientApplication | null = null;

/**
 * Get or create MSAL Public Client instance
 *
 * @returns {PublicClientApplication} MSAL client configured for PKCE flow
 */
export function getMsalClient(): PublicClientApplication {
  if (!msalInstance) {
    const config = loadConfig();

    msalInstance = new PublicClientApplication({
      auth: {
        clientId: config.msalClientId,
        authority: `https://login.microsoftonline.com/${config.msalTenantId}`,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message, containsPii) {
            if (containsPii) {
              return;
            }
            console.log(message);
          },
          piiLoggingEnabled: false,
          logLevel: 3, // Info level
        },
      },
    });
  }

  return msalInstance;
}

/**
 * Generate PKCE challenge and verifier
 *
 * @returns {Promise<{verifier: string, challenge: string}>} PKCE pair
 */
export async function generatePkce(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const cryptoProvider = new CryptoProvider();
  const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

  return { verifier, challenge };
}

/**
 * Create authorization URL with PKCE
 *
 * @param {string} state - Random state parameter for CSRF protection
 * @param {string} codeChallenge - PKCE code challenge
 * @returns {Promise<string>} Authorization URL for redirect
 */
export async function createAuthUrl(
  state: string,
  codeChallenge: string,
): Promise<string> {
  const config = loadConfig();
  const msalClient = getMsalClient();

  const authCodeUrlParameters = {
    scopes: ["User.Read", "openid", "profile", "email"],
    redirectUri: config.msalRedirectUri,
    state,
    codeChallenge,
    codeChallengeMethod: "S256" as const,
  };

  return await msalClient.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Acquire token by authorization code (after callback)
 *
 * @param {string} code - Authorization code from Azure AD
 * @param {string} codeVerifier - PKCE code verifier
 * @returns {Promise<any>} Token response with user info
 */
export async function acquireTokenByCode(
  code: string,
  codeVerifier: string,
): Promise<any> {
  const config = loadConfig();
  const msalClient = getMsalClient();

  const tokenRequest = {
    code,
    scopes: ["User.Read", "openid", "profile", "email"],
    redirectUri: config.msalRedirectUri,
    codeVerifier,
  };

  const response = await msalClient.acquireTokenByCode(tokenRequest);

  return response;
}
