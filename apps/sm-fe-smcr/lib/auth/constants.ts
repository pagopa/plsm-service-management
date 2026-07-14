export const AUTH_COOKIE_NAME = "auth-token";
export const AUTH_STATE_COOKIE_NAME = "auth_state";
export const AUTH_RETURN_URL_COOKIE_NAME = "auth-return-url";
export const PKCE_VERIFIER_COOKIE_NAME = "pkce_verifier";

export const AUTH_COOKIE_NAMES = [
  AUTH_COOKIE_NAME,
  AUTH_STATE_COOKIE_NAME,
  AUTH_RETURN_URL_COOKIE_NAME,
  PKCE_VERIFIER_COOKIE_NAME,
] as const;
