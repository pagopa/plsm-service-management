// =============================================================================
// DIAGNOSTIC LOGGER - Logging sessioni CRM su Azure Blob Storage
//
// Feature flag: DIAGNOSTIC_LOGGING_ENABLED=true
//
// Ogni chiamata POST /meetings genera un file JSON su Blob Storage con:
// - Il payload ricevuto dal frontend (persistito con mascheratura parziale)
// - Tutte le chiamate HTTP effettuate verso Dynamics 365 (step, url, body, status, durata)
// - Il risultato finale dell'orchestrazione
//
// Il blob viene scritto in fire-and-forget: un eventuale errore di scrittura
// non blocca la risposta al frontend.
//
// Struttura blob: {container}/{YYYY}/{MM}/{DD}/{sessionId}.json
// =============================================================================

import { randomUUID } from "node:crypto";
import { BlobServiceClient } from "@azure/storage-blob";

let cachedBlobServiceClient: BlobServiceClient | null = null;
let cachedContainerClient: ReturnType<
  BlobServiceClient["getContainerClient"]
> | null = null;
let cachedConnectionString: string | null = null;
let cachedContainerName: string | null = null;

// -----------------------------------------------------------------------------
// Tipi
// -----------------------------------------------------------------------------

/**
 * Rappresenta una singola chiamata HTTP verso Dynamics 365 tracciata nella sessione.
 */
export interface DiagnosticCall {
  /** Nome dello step orchestrator (es. "verifyAccount", "createContact", "createAppointment") */
  step: string;
  /** Metodo HTTP */
  method: "GET" | "POST";
  /** URL completo della chiamata */
  url: string;
  /** Body inviato (null per GET) */
  requestBody: unknown | null;
  /** HTTP status code ricevuto (null se la chiamata ha lanciato eccezione) */
  responseStatus: number | null;
  /** Durata della chiamata in millisecondi */
  durationMs: number;
  /** Messaggio di errore se la chiamata è fallita */
  error?: string;
}

/**
 * Sessione diagnostica completa per una singola richiesta POST /meetings.
 * Viene accumulata durante l'orchestrazione e scritta su Blob Storage al termine.
 */
export interface DiagnosticSession {
  /** UUID univoco della sessione */
  sessionId: string;
  /** Timestamp ISO 8601 dell'inizio della sessione */
  timestamp: string;
  /** Ambiente Dynamics target ("UAT" | "PROD") */
  environment: string;
  /** Payload ricevuto dal frontend, mascherato parzialmente in fase di persistenza */
  frontendPayload: unknown;
  /** Lista ordinata di tutte le chiamate HTTP verso Dynamics */
  dynamicsCalls: DiagnosticCall[];
  /** Risultato finale restituito dall'orchestratore (popolato a fine flusso) */
  orchestratorResult?: unknown;
}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

/**
 * Crea una nuova sessione diagnostica.
 *
 * @param frontendPayload - Il payload ricevuto dal frontend (body della request)
 * @param environment - Ambiente Dynamics target ("UAT" | "PROD")
 * @returns Nuova DiagnosticSession con sessionId e timestamp impostati
 */
export function createDiagnosticSession(
  frontendPayload: unknown,
  environment: string,
): DiagnosticSession {
  return {
    sessionId: randomUUID(),
    timestamp: new Date().toISOString(),
    environment,
    frontendPayload,
    dynamicsCalls: [],
  };
}

const PARTIALLY_MASKED_FIELDS = new Set([
  "email",
  "emailaddress1",
  "firstname",
  "lastname",
  "nome",
  "cognome",
  "subject",
  "description",
  "location",
]);

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function maskText(value: string, visibleChars = 3): string {
  if (value.length <= visibleChars) {
    return `${value}***`;
  }

  return `${value.slice(0, visibleChars)}***`;
}

function maskEmail(value: string): string {
  const [localPart, domainPart] = value.split("@");

  if (!localPart || !domainPart) {
    return maskText(value);
  }

  const domainSegments = domainPart.split(".");
  const maskedDomain = domainSegments
    .map((segment, index) => {
      const isTopLevelDomain = index === domainSegments.length - 1;
      return isTopLevelDomain ? segment : maskText(segment);
    })
    .join(".");

  return `${maskText(localPart)}@${maskedDomain}`;
}

function sanitizeDiagnosticString(value: string, fieldName?: string): string {
  const normalizedFieldName = fieldName?.toLowerCase();

  if (normalizedFieldName && PARTIALLY_MASKED_FIELDS.has(normalizedFieldName)) {
    return normalizedFieldName.includes("email")
      ? maskEmail(value)
      : maskText(value);
  }

  return value.replace(EMAIL_PATTERN, (match) => maskEmail(match));
}

function sanitizeDiagnosticValue(value: unknown, fieldName?: string): unknown {
  if (typeof value === "string") {
    return sanitizeDiagnosticString(value, fieldName);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDiagnosticValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([key, nestedValue]) => [
          key,
          sanitizeDiagnosticValue(nestedValue, key),
        ],
      ),
    );
  }

  return value;
}

function buildPersistedDiagnosticSession(
  session: DiagnosticSession,
): DiagnosticSession {
  return {
    ...session,
    frontendPayload: sanitizeDiagnosticValue(
      session.frontendPayload,
      "frontendPayload",
    ),
    dynamicsCalls: session.dynamicsCalls.map((call) => ({
      ...call,
      url: sanitizeDiagnosticString(call.url),
      requestBody: sanitizeDiagnosticValue(call.requestBody, "requestBody"),
      error: call.error ? sanitizeDiagnosticString(call.error) : undefined,
    })),
    orchestratorResult: sanitizeDiagnosticValue(
      session.orchestratorResult,
      "orchestratorResult",
    ),
  };
}

// -----------------------------------------------------------------------------
// Accumulo chiamate
// -----------------------------------------------------------------------------

/**
 * Aggiunge una chiamata HTTP alla sessione diagnostica.
 * Mutazione in-place: non restituisce nulla.
 *
 * @param session - La sessione corrente
 * @param call - Dati della chiamata da registrare
 */
export function addDiagnosticCall(
  session: DiagnosticSession,
  call: DiagnosticCall,
): void {
  session.dynamicsCalls.push(call);
}

// -----------------------------------------------------------------------------
// Feature flag
// -----------------------------------------------------------------------------

/**
 * Ritorna true se il diagnostic logging è abilitato tramite feature flag.
 * Legge direttamente le env var per supportare la disattivazione a runtime
 * senza richiedere un rideploy del codice.
 *
 * Env var richieste per il funzionamento completo:
 * - DIAGNOSTIC_LOGGING_ENABLED=true
 * - DIAGNOSTIC_STORAGE_CONNECTION_STRING=<connection string>
 */
export function isDiagnosticEnabled(): boolean {
  return process.env.DIAGNOSTIC_LOGGING_ENABLED?.toLowerCase() === "true";
}

function getDiagnosticContainerClient(
  connectionString: string,
  container: string,
) {
  if (
    cachedContainerClient &&
    cachedBlobServiceClient &&
    cachedConnectionString === connectionString &&
    cachedContainerName === container
  ) {
    return cachedContainerClient;
  }

  cachedBlobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  cachedContainerClient = cachedBlobServiceClient.getContainerClient(container);
  cachedConnectionString = connectionString;
  cachedContainerName = container;

  return cachedContainerClient;
}

// -----------------------------------------------------------------------------
// Scrittura Blob
// -----------------------------------------------------------------------------

/**
 * Scrive la sessione diagnostica su Azure Blob Storage in modalità fire-and-forget.
 *
 * Il blob viene creato nel path: {container}/{YYYY}/{MM}/{DD}/{sessionId}.json
 * Il container deve esistere già ed essere provisionato dall'infrastruttura.
 *
 * Prima della persistenza, i principali campi stringa sensibili vengono
 * mascherati lasciando visibili solo i primi caratteri utili al troubleshooting.
 *
 * Se la scrittura fallisce (connection string assente, errore di rete, ecc.),
 * l'errore viene loggato su console ma NON viene propagato: la risposta al
 * frontend non viene mai bloccata da questo step.
 *
 * @param session - La sessione diagnostica completa da persistere
 */
export async function writeDiagnosticBlob(
  session: DiagnosticSession,
): Promise<void> {
  const connectionString = process.env.DIAGNOSTIC_STORAGE_CONNECTION_STRING;
  const container =
    process.env.DIAGNOSTIC_STORAGE_CONTAINER ?? "crm-diagnostics";

  if (!connectionString) {
    console.warn(
      "[DiagnosticLogger] DIAGNOSTIC_STORAGE_CONNECTION_STRING non configurata — blob non scritto",
    );
    return;
  }

  try {
    const containerClient = getDiagnosticContainerClient(
      connectionString,
      container,
    );

    // Path blob: YYYY/MM/DD/sessionId.json
    const date = new Date(session.timestamp);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const blobName = `${yyyy}/${mm}/${dd}/${session.sessionId}.json`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const persistedSession = buildPersistedDiagnosticSession(session);
    const content = JSON.stringify(persistedSession, null, 2);

    await blockBlobClient.upload(content, Buffer.byteLength(content), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });

    console.log(
      `[DiagnosticLogger] Sessione scritta: ${container}/${blobName}`,
    );
  } catch (error) {
    // Fire-and-forget: non blocca la risposta al frontend
    const msg = error instanceof Error ? error.message : String(error);
    console.error(
      `[DiagnosticLogger] Errore scrittura blob — sessione ${session.sessionId}: ${msg}`,
    );
  }
}
