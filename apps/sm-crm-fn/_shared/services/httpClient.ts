// =============================================================================
// HTTP CLIENT - Client HTTP per Dynamics 365 con supporto dry-run
// =============================================================================

import { randomUUID } from "node:crypto";
import { getAccessToken, buildScope } from "./auth";
import { getConfigOrThrow } from "../utils/config";
import type { DynamicsList } from "../types/dynamics";
import {
  createLogger,
  logHttpRequest,
  logHttpResponse,
  Timer,
} from "../utils/logger";

// -----------------------------------------------------------------------------
// Headers standard per Dynamics OData API
// -----------------------------------------------------------------------------

async function getHeaders(): Promise<Record<string, string>> {
  const cfg = getConfigOrThrow();
  const scope = buildScope(cfg.DYNAMICS_BASE_URL);
  const token = await getAccessToken(scope);

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    Accept: "application/json",
    Prefer: "return=representation",
  };
}

// -----------------------------------------------------------------------------
// URL Builder
// -----------------------------------------------------------------------------

export interface BuildUrlParams {
  endpoint: string;
  filter?: string;
  select?: string;
  top?: string;
  expand?: string;
}

export function buildUrl(params: BuildUrlParams): string {
  const cfg = getConfigOrThrow();
  const url = new URL(params.endpoint, cfg.DYNAMICS_BASE_URL);

  if (params.filter) url.searchParams.set("$filter", params.filter);
  if (params.select) url.searchParams.set("$select", params.select);
  if (params.top) url.searchParams.set("$top", params.top);
  if (params.expand) url.searchParams.set("$expand", params.expand);

  return url.toString();
}

// -----------------------------------------------------------------------------
// Dry-Run Context
// -----------------------------------------------------------------------------

export interface DryRunContext {
  enabled: boolean;
  simulatedResponses?: Map<string, unknown>;
}

let dryRunContext: DryRunContext = { enabled: false };

/**
 * Abilita la modalità dry-run per test senza modifiche a Dynamics.
 *
 * In dry-run mode:
 * - GET: ritorna mock realistici (account, contact, appointment)
 * - POST: logga il body e ritorna UUID generati
 * - Nessuna chiamata HTTP viene effettuata
 *
 * @param simulatedResponses - Map opzionale di risposte personalizzate per URL
 *
 * @example
 * enableDryRun();
 * const result = await createMeetingOrchestrator({ ... });
 * disableDryRun();
 */
export function enableDryRun(simulatedResponses?: Map<string, unknown>): void {
  dryRunContext = {
    enabled: true,
    simulatedResponses: simulatedResponses ?? new Map(),
  };
  console.log(
    "🧪 DRY-RUN MODE ENABLED - Nessuna chiamata verrà effettuata a Dynamics",
  );
}

/**
 * Disabilita la modalità dry-run e riattiva le chiamate reali.
 */
export function disableDryRun(): void {
  dryRunContext = { enabled: false };
  console.log("✅ DRY-RUN MODE DISABLED - Chiamate reali abilitate");
}

export function isDryRunEnabled(): boolean {
  return dryRunContext.enabled;
}

// -----------------------------------------------------------------------------
// Generatore UUID per dry-run
// -----------------------------------------------------------------------------

function generateMockUuid(): string {
  return randomUUID();
}

// -----------------------------------------------------------------------------
// HTTP Methods con supporto dry-run
// -----------------------------------------------------------------------------

export async function get<T>(url: string): Promise<DynamicsList<T>> {
  const logger = createLogger();
  const timer = new Timer();

  if (dryRunContext.enabled) {
    logger.info(`🧪 [DRY-RUN] GET`, { url, dryRun: true });

    // Simula risposta vuota o usa risposta configurata
    const simulatedResponse = dryRunContext.simulatedResponses?.get(url);
    if (simulatedResponse) {
      logger.info(`🧪 [DRY-RUN] Using simulated response`, { dryRun: true });
      return simulatedResponse as DynamicsList<T>;
    }

    // Genera mock realistici basati sull'endpoint
    const mockData = generateMockForEndpoint<T>(url);
    if (mockData) {
      logger.info(`🧪 [DRY-RUN] Generated mock for endpoint`, { dryRun: true });
      return { value: [mockData] };
    }

    // Default: lista vuota
    logger.warn(`🧪 [DRY-RUN] No mock available, returning empty list`, {
      dryRun: true,
    });
    return { value: [] };
  }

  logHttpRequest(logger, "GET", url);

  try {
    const headers = await getHeaders();
    const response = await fetch(url, { method: "GET", headers });
    const duration = timer.elapsed();

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`GET request failed`, new Error(errorBody), {
        url,
        statusCode: response.status,
        duration,
        method: "GET",
      });
      throw new Error(`GET ${url} failed: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();

    // Se è una singola entità (non una lista), wrappala
    const result: DynamicsList<T> =
      "value" in data ? (data as DynamicsList<T>) : { value: [data as T] };

    const resultCount = result.value?.length ?? 0;

    logHttpResponse(logger, "GET", url, response.status, duration, resultCount);

    return result;
  } catch (error) {
    const duration = timer.elapsed();
    logger.error(`GET request exception`, error, {
      url,
      duration,
      method: "GET",
    });
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Generatore mock per endpoint specifici in dry-run
// -----------------------------------------------------------------------------

function generateMockForEndpoint<T>(url: string): T | null {
  const mockId = generateMockUuid();

  // Mock per accounts
  if (url.includes("/accounts")) {
    return {
      accountid: mockId,
      name: "Mock Ente S.p.A.",
      pgp_identificativoselfcare: "mock-selfcare-id",
      pgp_denominazioneselfcare: "Mock Ente",
      emailaddress1: "mock@ente.it",
      statecode: 0,
    } as T;
  }

  // Mock per contacts
  if (url.includes("/contacts")) {
    return {
      contactid: mockId,
      fullname: "Mock Contact",
      firstname: "Mock",
      lastname: "Contact",
      emailaddress1: "mock@contact.it",
    } as T;
  }

  // Mock per appointments
  if (url.includes("/appointments")) {
    return {
      activityid: mockId,
      subject: "Mock Appointment",
      scheduledstart: new Date().toISOString(),
      scheduledend: new Date(Date.now() + 3600000).toISOString(),
      statecode: 0,
      statuscode: 5,
    } as T;
  }

  return null;
}

export async function post<TRequest, TResponse>(
  url: string,
  body: TRequest,
): Promise<TResponse> {
  const logger = createLogger();
  const timer = new Timer();

  if (dryRunContext.enabled) {
    logger.info(`🧪 [DRY-RUN] POST`, {
      url,
      dryRun: true,
      bodySize: JSON.stringify(body).length,
    });
    logger.debug(`🧪 [DRY-RUN] Body`, { body, dryRun: true });

    // Simula risposta con ID generato
    const mockId = generateMockUuid();
    const mockResponse = {
      ...(body as object),
      activityid: mockId,
      contactid: mockId,
      accountid: mockId,
    } as TResponse;

    logger.info(`🧪 [DRY-RUN] Mock response generated`, {
      mockId,
      dryRun: true,
    });
    return mockResponse;
  }

  logHttpRequest(logger, "POST", url);
  logger.debug("POST body", { body });

  try {
    const headers = await getHeaders();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const duration = timer.elapsed();

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`POST request failed`, new Error(errorBody), {
        url,
        statusCode: response.status,
        duration,
        method: "POST",
      });
      throw new Error(`POST ${url} failed: ${response.status} - ${errorBody}`);
    }

    // Per GrantAccess la response è 204 No Content
    if (response.status === 204) {
      logHttpResponse(logger, "POST", url, response.status, duration);
      return {} as TResponse;
    }

    // Estrai ID dall'header OData-EntityId se presente
    const entityId = response.headers.get("OData-EntityId");
    const data = await response.json().catch(() => ({}));

    if (entityId && !data.activityid && !data.contactid) {
      // Estrai GUID dall'header
      const match = entityId.match(/\(([a-f0-9-]+)\)/i);
      if (match) {
        (data as Record<string, unknown>).extractedId = match[1];
        logger.debug("Extracted entity ID from OData-EntityId header", {
          entityId: match[1],
        });
      }
    }

    logHttpResponse(logger, "POST", url, response.status, duration);

    return data as TResponse;
  } catch (error) {
    const duration = timer.elapsed();
    logger.error(`POST request exception`, error, {
      url,
      duration,
      method: "POST",
    });
    throw error;
  }
}

export async function postAction<TRequest>(
  url: string,
  body: TRequest,
): Promise<void> {
  if (dryRunContext.enabled) {
    console.log(`🧪 [DRY-RUN] POST (Action) ${url}`);
    console.log(`🧪 [DRY-RUN] Body:`, JSON.stringify(body, null, 2));
    console.log(`🧪 [DRY-RUN] Action simulata con successo`);
    return;
  }

  const headers = await getHeaders();
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `POST Action ${url} failed: ${response.status} - ${errorBody}`,
    );
  }
}
