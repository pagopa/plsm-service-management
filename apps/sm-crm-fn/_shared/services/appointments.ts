// =============================================================================
// APPOINTMENTS SERVICE - Gestione Appuntamenti su Dynamics 365
// =============================================================================

import type {
  Appointment,
  DynamicsList,
  CreateAppointmentRequest,
  AppointmentParty,
  ProductIdSelfcare,
} from "../types/dynamics";
import { get, post, buildUrl } from "./httpClient";
import { type Logger } from "../utils/logger";
import { getProductGuid, resolveEnvironment } from "../utils/mappings";
import type { DiagnosticSession } from "./diagnosticLogger";
import { addDiagnosticCall } from "./diagnosticLogger";

// -----------------------------------------------------------------------------
// Lista Appuntamenti
// -----------------------------------------------------------------------------

/**
 * Lista tutti gli appuntamenti in Dynamics CRM.
 *
 * @param baseUrl - Base URL di Dynamics 365
 * @param params - Parametri di query
 * @param params.filter - Filtro OData
 * @param params.select - Campi da selezionare
 * @param params.top - Numero massimo di risultati
 * @param logger - Logger opzionale
 * @returns Lista di appuntamenti
 */
export async function listAppointments(
  baseUrl: string,
  params?: {
    filter?: string;
    select?: string;
    top?: string;
  },
  logger?: Logger,
): Promise<DynamicsList<Appointment>> {
  if (!baseUrl) {
    throw new Error(
      "listAppointments: baseUrl is required and cannot be empty",
    );
  }
  const url = buildUrl({
    baseUrl,
    endpoint: "/api/data/v9.2/appointments",
    filter: params?.filter,
    select:
      params?.select ??
      "activityid,subject,scheduledstart,scheduledend,location,description,statecode,statuscode,pgp_oggettodelcontatto,category,sortdate",
    top: params?.top,
  });

  logger?.info("Fetching appointments from Dynamics", {
    url,
    odataFilter: params?.filter,
    odataTop: params?.top,
  });

  return get<Appointment>(url, baseUrl);
}

// -----------------------------------------------------------------------------
// Endpoint 6: Crea Appuntamento con Activity Parties
// -----------------------------------------------------------------------------

export interface CreateFullAppointmentParams {
  subject: string;
  scheduledstart: string;
  scheduledend: string;
  location?: string;
  description?: string;
  oggettoDelContatto?: number;
  categoria?: string;
  /**
   * Data prossimo contatto previsto (campo standard Dynamics, formato ISO 8601 datetime).
   * Accetta anche formato solo data (es. "2026-04-20") che viene auto-normalizzato
   * aggiungendo "T00:00:00Z" per soddisfare il formato Edm.DateTimeOffset di Dynamics.
   */
  dataProssimoContatto?: string;
  /** ID Selfcare del prodotto, usato per collegare l'appuntamento al prodotto in Dynamics */
  productIdSelfcare?: ProductIdSelfcare;
  accountId: string;
  contactIds: string[];
  ownerId?: string;
  baseUrl: string;
  /** Sessione diagnostica opzionale per il logging su Blob Storage */
  diagnosticSession?: DiagnosticSession;
}

/**
 * Crea un Appuntamento in Dynamics con partecipanti.
 *
 * Endpoint 6: POST /api/data/v9.2/appointments
 *
 * Include automaticamente:
 * - appointment_activity_parties con tutti i contatti e l'account
 * - regardingobjectid_account per collegare all'ente
 * - statuscode: 5 (Busy)
 *
 * @param params - Dati dell'appuntamento
 * @param params.subject - Oggetto
 * @param params.scheduledstart - Data/ora inizio (ISO 8601)
 * @param params.scheduledend - Data/ora fine (ISO 8601)
 * @param params.accountId - GUID dell'ente
 * @param params.contactIds - Array di GUID dei contatti partecipanti
 * @param params.location - Luogo (default: "Meet")
 * @param params.description - Descrizione
 * @param params.oggettoDelContatto - Oggetto del contatto: valore Picklist (Edm.Int32) da Dynamics 365. Default suggerito: 100000005 (Integrazione Tecnica)
 * @param params.categoria - Categoria appuntamento (campo standard Dynamics)
 * @param params.dataProssimoContatto - Data prossimo contatto previsto. Accetta ISO 8601 datetime o solo data (auto-normalizzata a T00:00:00Z)
 * @param params.productIdSelfcare - ID Selfcare del prodotto da collegare all'appuntamento
 * @param params.baseUrl - Base URL di Dynamics 365
 * @param params.diagnosticSession - Sessione diagnostica opzionale
 * @returns Appuntamento creato con activityid
 */
export async function createAppointment(
  params: CreateFullAppointmentParams,
): Promise<Appointment> {
  const url = buildUrl({
    baseUrl: params.baseUrl,
    endpoint: "/api/data/v9.2/appointments",
  });

  // Costruisci activity_parties
  const activityParties: AppointmentParty[] = [];

  // Aggiungi ogni contatto come partecipante (participationtypemask = 5 = Required)
  for (const contactId of params.contactIds) {
    activityParties.push({
      participationtypemask: 5,
      "partyid_contact@odata.bind": `/contacts(${contactId})`,
    });
  }

  // Aggiungi l'account come partecipante
  activityParties.push({
    participationtypemask: 5,
    "partyid_account@odata.bind": `/accounts(${params.accountId})`,
  });

  const body: CreateAppointmentRequest = {
    subject: params.subject,
    scheduledstart: params.scheduledstart,
    scheduledend: params.scheduledend,
    location: params.location ?? "Meet",
    description: params.description,
    statuscode: 5, // Busy
    "regardingobjectid_account@odata.bind": `/accounts(${params.accountId})`,
    appointment_activity_parties: activityParties,
  };

  // Aggiungi owner se specificato
  if (params.ownerId) {
    body["ownerid@odata.bind"] = `/systemusers(${params.ownerId})`;
  }

  // Aggiungi oggetto del contatto se specificato
  if (params.oggettoDelContatto !== undefined) {
    body.pgp_oggettodelcontatto = params.oggettoDelContatto;
  }

  // Aggiungi categoria se specificata
  if (params.categoria !== undefined) {
    body.category = params.categoria;
  }

  // Aggiungi data prossimo contatto se specificata.
  // Auto-normalizza il formato solo-data (es. "2026-04-20") aggiungendo "T00:00:00Z"
  // per soddisfare il formato Edm.DateTimeOffset richiesto da Dynamics 365.
  if (params.dataProssimoContatto !== undefined) {
    body.sortdate = params.dataProssimoContatto.includes("T")
      ? params.dataProssimoContatto
      : `${params.dataProssimoContatto}T00:00:00Z`;
  }

  // Collega il prodotto Selfcare all'appuntamento se specificato
  if (params.productIdSelfcare) {
    const environment = resolveEnvironment(params.baseUrl);
    const productGuid = getProductGuid(params.productIdSelfcare, environment);
    if (productGuid) {
      body["pgp_Prodottoid@odata.bind"] = `/products(${productGuid})`;
    } else {
      console.warn(
        `[Appointments] Prodotto ${params.productIdSelfcare} non trovato per ambiente ${environment} — campo omesso`,
      );
    }
  }

  console.log(`[Appointments] Creazione appuntamento: ${params.subject}`);
  console.log(
    `[Appointments] Partecipanti: ${params.contactIds.length} contatti + 1 account`,
  );

  const timer = Date.now();
  let responseStatus: number | null = null;
  let thrownError: string | undefined;

  try {
    const result = await post<CreateAppointmentRequest, Appointment>(
      url,
      body,
      params.baseUrl,
    );
    responseStatus = 201;
    console.log(`[Appointments] Appuntamento creato: ${result.activityid}`);

    if (params.diagnosticSession) {
      addDiagnosticCall(params.diagnosticSession, {
        step: "createAppointment",
        method: "POST",
        url,
        requestBody: body,
        responseStatus,
        durationMs: Date.now() - timer,
      });
    }

    return result;
  } catch (error) {
    thrownError = error instanceof Error ? error.message : String(error);
    responseStatus = null;

    if (params.diagnosticSession) {
      addDiagnosticCall(params.diagnosticSession, {
        step: "createAppointment",
        method: "POST",
        url,
        requestBody: body,
        responseStatus,
        durationMs: Date.now() - timer,
        error: thrownError,
      });
    }

    throw error;
  }
}

// -----------------------------------------------------------------------------
// Get Appuntamento by ID
// -----------------------------------------------------------------------------

/**
 * Recupera un appuntamento per ID.
 *
 * @param activityId - GUID dell'appuntamento
 * @param baseUrl - Base URL di Dynamics 365
 * @returns Appuntamento o null se non trovato
 */
export async function getAppointmentById(
  activityId: string,
  baseUrl: string,
): Promise<Appointment | null> {
  const url = buildUrl({
    baseUrl,
    endpoint: `/api/data/v9.2/appointments(${activityId})`,
    select:
      "activityid,subject,scheduledstart,scheduledend,location,description,statecode,statuscode,pgp_oggettodelcontatto,category,sortdate",
  });

  console.log(`[Appointments] Fetching appointment: ${activityId}`);

  try {
    const result = await get<Appointment>(url, baseUrl);
    return result.value?.[0] ?? (result as unknown as Appointment);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("404")) {
      return null;
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Lista Appuntamenti per Contatto
// -----------------------------------------------------------------------------

/**
 * Lista appuntamenti per un contatto specifico.
 *
 * @param contactId - GUID del contatto
 * @param baseUrl - Base URL di Dynamics 365
 * @returns Lista di appuntamenti collegati al contatto
 */
export async function listAppointmentsByContact(
  contactId: string,
  baseUrl: string,
): Promise<DynamicsList<Appointment>> {
  return listAppointments(
    baseUrl,
    {
      filter: `_regardingobjectid_value eq ${contactId}`,
    },
    undefined,
  );
}

// -----------------------------------------------------------------------------
// Lista Appuntamenti per Account
// -----------------------------------------------------------------------------

/**
 * Lista appuntamenti per un account specifico.
 *
 * @param accountId - GUID dell'account
 * @param baseUrl - Base URL di Dynamics 365
 * @returns Lista di appuntamenti collegati all'account
 */
export async function listAppointmentsByAccount(
  accountId: string,
  baseUrl: string,
): Promise<DynamicsList<Appointment>> {
  return listAppointments(
    baseUrl,
    {
      filter: `_regardingobjectid_value eq ${accountId}`,
    },
    undefined,
  );
}
