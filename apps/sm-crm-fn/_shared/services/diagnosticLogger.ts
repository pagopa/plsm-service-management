// =============================================================================
// DIAGNOSTIC LOGGER - Logging sessioni CRM su Azure Blob Storage
//
// Feature flag: DIAGNOSTIC_LOGGING_ENABLED=true
//
// Ogni chiamata POST /meetings genera un file JSON su Blob Storage con:
// - Il payload ricevuto dal frontend
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
  /** Payload ricevuto dal frontend, così com'è */
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

// -----------------------------------------------------------------------------
// Scrittura Blob
// -----------------------------------------------------------------------------

/**
 * Scrive la sessione diagnostica su Azure Blob Storage in modalità fire-and-forget.
 *
 * Il blob viene creato nel path: {container}/{YYYY}/{MM}/{DD}/{sessionId}.json
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
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(container);

    // Crea il container se non esiste (idempotente)
    await containerClient.createIfNotExists();

    // Path blob: YYYY/MM/DD/sessionId.json
    const date = new Date(session.timestamp);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const blobName = `${yyyy}/${mm}/${dd}/${session.sessionId}.json`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const content = JSON.stringify(session, null, 2);

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
