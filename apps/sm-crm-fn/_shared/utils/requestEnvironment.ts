import { HttpRequest } from "@azure/functions";

/**
 * Supported Dynamics 365 environment types.
 * Used to route requests to different Dynamics instances.
 */
export type DynamicsEnvironment = "UAT" | "PROD";

/**
 * Header name for specifying the target Dynamics environment.
 * Expected values: "UAT" or "PROD" (case-insensitive).
 */
export const DYNAMICS_ENVIRONMENT_HEADER = "x-dynamics-environment";

/**
 * Custom error thrown when an invalid Dynamics environment header value is provided.
 */
export class InvalidDynamicsEnvironmentError extends Error {
  constructor(
    public readonly headerName: string,
    public readonly headerValue: string,
  ) {
    super(
      `Invalid ${headerName} header value: "${headerValue}". Must be "UAT" or "PROD".`,
    );
    this.name = "InvalidDynamicsEnvironmentError";
  }
}

/**
 * Type guard to check if an error is an InvalidDynamicsEnvironmentError.
 */
export function isInvalidDynamicsEnvironmentError(
  error: unknown,
): error is InvalidDynamicsEnvironmentError {
  return error instanceof InvalidDynamicsEnvironmentError;
}

/**
 * Resolves the target Dynamics environment from the request header.
 *
 * @param request - Azure Functions HTTP request object
 * @returns The resolved environment type ("UAT" or "PROD")
 * @throws InvalidDynamicsEnvironmentError if the header value is invalid (not "UAT" or "PROD")
 *
 * @example
 * ```typescript
 * const env = resolveDynamicsEnvironment(request);
 * // Returns "UAT" if header is "uat", "UAT", etc.
 * // Returns "PROD" if header is "prod", "PROD", missing, etc.
 * // Throws InvalidDynamicsEnvironmentError if header is "invalid"
 * ```
 */
export function resolveDynamicsEnvironment(
  request: HttpRequest,
): DynamicsEnvironment {
  const headerValue = request.headers.get(DYNAMICS_ENVIRONMENT_HEADER);

  // Default to PROD if header is not present (backward compatibility)
  if (!headerValue) {
    return "PROD";
  }

  const normalized = headerValue.trim().toUpperCase();

  if (normalized === "UAT" || normalized === "PROD") {
    return normalized as DynamicsEnvironment;
  }

  throw new InvalidDynamicsEnvironmentError(
    DYNAMICS_ENVIRONMENT_HEADER,
    headerValue,
  );
}

/**
 * Gets the appropriate Dynamics base URL for the specified environment.
 *
 * @param environment - Target Dynamics environment ("UAT" or "PROD")
 * @returns The base URL for the specified environment
 * @throws Error if the required environment variable is not set
 *
 * @example
 * ```typescript
 * const baseUrl = getDynamicsBaseUrl("UAT");
 * // Returns value of DYNAMICS_BASE_URL_UAT
 *
 * const baseUrl = getDynamicsBaseUrl("PROD");
 * // Returns value of DYNAMICS_BASE_URL
 * ```
 */
export function getDynamicsBaseUrl(environment: DynamicsEnvironment): string {
  const envVar =
    environment === "UAT" ? "DYNAMICS_BASE_URL_UAT" : "DYNAMICS_BASE_URL";

  const url = process.env[envVar];

  if (!url) {
    throw new Error(
      `Environment variable ${envVar} is not set for ${environment} environment`,
    );
  }

  return url;
}

/**
 * Gets the appropriate Dynamics contacts URL for the specified environment.
 *
 * @param environment - Target Dynamics environment ("UAT" or "PROD")
 * @returns The contacts URL for the specified environment, or undefined if not set
 *
 * @example
 * ```typescript
 * const contactsUrl = getDynamicsContactsUrl("UAT");
 * // Returns value of DYNAMICS_URL_CONTACTS_UAT if set, otherwise undefined
 *
 * const contactsUrl = getDynamicsContactsUrl("PROD");
 * // Returns value of DYNAMICS_URL_CONTACTS if set, otherwise undefined
 * ```
 */
export function getDynamicsContactsUrl(
  environment: DynamicsEnvironment,
): string | undefined {
  const envVar =
    environment === "UAT"
      ? "DYNAMICS_URL_CONTACTS_UAT"
      : "DYNAMICS_URL_CONTACTS";

  return process.env[envVar];
}
