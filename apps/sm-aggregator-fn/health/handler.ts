import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { ConfigError, loadConfig } from "../_shared/config";

export type HealthResponse = {
  status: "healthy" | "degraded";
  timestamp: string;
  incrementMode?: "mock" | "live";
  missingConfig?: string[];
  invalidConfig?: string[];
};

/**
 * Health check usato da Azure (health_check_path = /api/v1/health) e dal warmup
 * dello slot. Risponde sempre 200, come auth-fn: lo stato reale è nel body.
 * Non espone mai valori di configurazione, solo i nomi delle variabili mancanti
 * (da aggiungere) o non valide (da correggere).
 */
export async function handler(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const timestamp = new Date().toISOString();

  try {
    const config = loadConfig();
    const body: HealthResponse = {
      status: "healthy",
      timestamp,
      incrementMode: config.incrementMode,
    };
    return { status: 200, jsonBody: body };
  } catch (error) {
    const missingConfig = error instanceof ConfigError ? error.missing : [];
    const invalidConfig = error instanceof ConfigError ? error.invalid : [];
    context.warn(
      error instanceof ConfigError
        ? error.message
        : "Health degraded: errore inatteso",
    );
    const body: HealthResponse = {
      status: "degraded",
      timestamp,
      missingConfig,
      invalidConfig,
    };
    return { status: 200, jsonBody: body };
  }
}
