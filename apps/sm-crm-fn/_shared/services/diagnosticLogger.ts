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
 * Dettagli della request OData estratti dall'URL (query params).
 */
export interface DiagnosticRequestDetails {
  entity?: string;
  filter?: string;
  select?: string;
  top?: string;
}

/**
 * Dati derivati dal payload frontend (valori logici estratti dall'orchestrator).
 */
export interface DiagnosticDerivedFromFrontend {
  institutionIdSelfcare?: string;
  productIdSelfcare?: string;
  accountId?: string;
  productGuid?: string | null;
  participantIndex?: number;
  participantEmail?: string;
  notes?: string[];
}

/**
 * Rappresenta una singola chiamata HTTP verso Dynamics 365 tracciata nella sessione.
 */
export interface DiagnosticCall {
  /** Numero sequenziale progressivo assegnato automaticamente */
  sequence: number;
  /** Nome dello step orchestrator (es. "verifyAccount", "createContact", "createAppointment") */
  step: string;
  /** Nome del substep tecnico (es. "getAccountBySelfcareId", "createContactRecord") */
  substep?: string;
  /** Entità Dynamics coinvolta */
  entity?: "accounts" | "contacts" | "appointments";
  /** Numero del tentativo (1-based, per eventuali retry) */
  attempt?: number;
  /** Riferimento al partecipante (utile per log contatti/appointments) */
  participantRef?: {
    index: number;
    email?: string;
  };
  /** Metodo HTTP */
  method: "GET" | "POST";
  /** URL completo della chiamata */
  url: string;
  /** Dettagli della richiesta OData (query params estratti) */
  requestDetails?: DiagnosticRequestDetails;
  /** Body inviato (null per GET) */
  requestBody: unknown | null;
  /** Dati derivati dal frontend per questa chiamata */
  derivedFromFrontend?: DiagnosticDerivedFromFrontend;
  /** HTTP status code ricevuto (null se la chiamata ha lanciato eccezione) */
  responseStatus: number | null;
  /**
   * Body restituito da Dynamics 365 (rappresentazione del record persistito).
   * Popolato solo per le POST andate a buon fine quando l'header
   * `Prefer: return=representation` è attivo: contiene il record ESATTO
   * come salvato da Dynamics, utile per verificare quali campi sono stati
   * effettivamente scritti senza accedere direttamente al CRM.
   */
  responseBody?: unknown;
  /** Durata della chiamata in millisecondi */
  durationMs: number;
  /** Indica se la chiamata ha avuto successo logico */
  success?: boolean;
  /** Messaggio di errore se la chiamata è fallita */
  error?: string;
}

/**
 * Motivo per cui un campo inviato a Dynamics non risulta persistito
 * nella rappresentazione restituita.
 * - `missing`: il campo era presente nel payload ma è null/assente nel record salvato
 *   (tipico di field-level security mancante o campo read-only ignorato).
 * - `overwritten`: il campo è stato salvato con un valore diverso da quello inviato
 *   (tipico di plugin/business rule/workflow che sovrascrivono il valore).
 */
export type FieldPersistenceReason = "missing" | "overwritten";

/**
 * Esito della verifica di persistenza di un singolo campo dell'appuntamento,
 * ottenuto confrontando il payload inviato con la rappresentazione restituita
 * da Dynamics 365.
 */
export interface FieldPersistenceIssue {
  /** Nome dell'attributo Dynamics verificato (es. "category", "pgp_oggettodelcontatto") */
  field: string;
  /** Valore inviato nel payload della POST */
  sentValue: unknown;
  /** Valore effettivamente persistito e restituito da Dynamics */
  persistedValue: unknown;
  /** Motivo della discrepanza */
  reason: FieldPersistenceReason;
}

/**
 * Riepilogo sintetico del flusso orchestratore costruito lato server.
 * Mostra il payload ricevuto, i dati derivati e l'esito di ogni step principale.
 */
export interface DiagnosticFlowSummary {
  /** Payload ricevuto dal frontend (può essere sanitized prima del log) */
  frontendRequest: unknown;
  /** Dati derivati dall'orchestrator durante il flusso */
  derivedData: {
    account?: {
      accountId: string;
      accountName: string;
      resolutionMethod: string;
    };
    product?: {
      productIdSelfcare?: string;
      environment: string;
      productGuid?: string | null;
    };
    contacts: Array<{
      participantIndex: number;
      email?: string;
      contactId?: string;
      status: "found" | "created" | "failed";
    }>;
    appointmentBindings?: Record<string, string | undefined>;
  };
  /** Request finale verso Dynamics per creare l'appointment (se disponibile) */
  finalDynamicsRequest?: {
    method: "POST";
    url: string;
    requestBody: unknown;
    derivedFromFrontend?: DiagnosticDerivedFromFrontend;
  };
  /** Steps del flusso orchestratore in ordine sequenziale */
  flowSteps: Array<{
    sequence: number;
    step: string;
    status: "started" | "completed" | "failed";
    summary: string;
  }>;
  /**
   * Esito della verifica di persistenza dei campi dell'appuntamento.
   * Elenca i campi inviati a Dynamics che NON risultano nella rappresentazione
   * restituita (mancanti) o che sono stati salvati con un valore diverso
   * (sovrascritti). Vuoto/assente quando tutti i campi inviati sono stati
   * persistiti correttamente.
   */
  persistenceIssues?: FieldPersistenceIssue[];
  /** Risultato finale dell'orchestrazione (popolato a fine flusso) */
  result?: unknown;
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
  /** Riepilogo sintetico del flusso costruito lato orchestratore */
  flowSummary: DiagnosticFlowSummary;
  /** Lista ordinata di tutte le chiamate HTTP verso Dynamics */
  dynamicsCalls: DiagnosticCall[];
  /** Risultato finale restituito dall'orchestratore (popolato a fine flusso) */
  orchestratorResult?: unknown;
  /** Contatore sequenziale per assegnare sequence automaticamente */
  nextSequence: number;
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
    flowSummary: {
      frontendRequest: frontendPayload,
      derivedData: {
        product: { environment },
        contacts: [],
      },
      flowSteps: [],
    },
    dynamicsCalls: [],
    nextSequence: 1,
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

function sanitizeDiagnosticValue(
  value: unknown,
  fieldName?: string,
  ancestors: object[] = [],
): unknown {
  if (typeof value === "string") {
    return sanitizeDiagnosticString(value, fieldName);
  }

  if (Array.isArray(value)) {
    if (ancestors.includes(value)) {
      return "[Circular]";
    }
    return value.map((item) =>
      sanitizeDiagnosticValue(item, undefined, [...ancestors, value]),
    );
  }

  if (value && typeof value === "object") {
    if (ancestors.includes(value)) {
      return "[Circular]";
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([key, nestedValue]) => [
          key,
          sanitizeDiagnosticValue(nestedValue, key, [...ancestors, value]),
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
    flowSummary: sanitizeDiagnosticValue(
      session.flowSummary,
      "flowSummary",
    ) as DiagnosticFlowSummary,
    dynamicsCalls: session.dynamicsCalls.map((call) => ({
      ...call,
      url: sanitizeDiagnosticString(call.url),
      requestDetails: sanitizeDiagnosticValue(
        call.requestDetails,
        "requestDetails",
      ) as DiagnosticRequestDetails | undefined,
      requestBody: sanitizeDiagnosticValue(call.requestBody, "requestBody"),
      responseBody: sanitizeDiagnosticValue(call.responseBody, "responseBody"),
      derivedFromFrontend: sanitizeDiagnosticValue(
        call.derivedFromFrontend,
        "derivedFromFrontend",
      ) as DiagnosticDerivedFromFrontend | undefined,
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
 * La sequence viene assegnata automaticamente incrementando nextSequence.
 *
 * @param session - La sessione corrente
 * @param call - Dati della chiamata da registrare (sequence esclusa)
 */
export function addDiagnosticCall(
  session: DiagnosticSession,
  call: Omit<DiagnosticCall, "sequence">,
): void {
  session.dynamicsCalls.push({
    ...call,
    sequence: session.nextSequence++,
  });
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
