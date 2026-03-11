/**
 * User claims extracted from Azure AD token
 */
export interface AzureAdTokenPayload {
  oid: string; // Object ID (unique user identifier)
  sub: string; // Subject (user identifier)
  name?: string; // Full name
  preferred_username?: string; // Email
  email?: string; // Email (alternative claim)
  given_name?: string; // First name
  family_name?: string; // Last name
  roles?: string[]; // App roles
  iss: string; // Issuer
  aud: string; // Audience
  exp: number; // Expiration time
  nbf: number; // Not before
  iat: number; // Issued at
  tid: string; // Tenant ID
}

/**
 * Internal JWT payload for Next.js application
 */
export interface InternalJwtPayload {
  userId: string; // oid from Azure AD
  email: string; // preferred_username or email
  name?: string; // User's full name
  roles?: string[]; // User's roles
  iss: string; // JWT_ISSUER
  aud: string; // JWT_AUDIENCE
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: AzureAdTokenPayload;
  error?: string;
}

/**
 * Environment configuration
 */
export interface AuthConfig {
  msalClientId: string;
  msalTenantId: string;
  msalRedirectUri: string;
  jwtSecret: string;
  jwtExpirySeconds: number;
  jwtIssuer: string;
  jwtAudience: string;
}

/**
 * Auth endpoints response types
 */
export interface AuthValidateResponse {
  success: boolean;
  message: string;
  user?: {
    userId: string;
    email: string;
    name?: string;
    roles?: string[];
  };
}

export interface AuthRefreshResponse {
  success: boolean;
  message: string;
}

export interface AuthLogoutResponse {
  success: boolean;
  message: string;
}

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  message: string;
  timestamp: string;
  config: {
    jwtIssuer: string;
    jwtAudience: string;
    jwtExpirySeconds: number;
    msalTenantConfigured: boolean;
    msalClientConfigured: boolean;
    jwtSecretConfigured: boolean;
  };
}
