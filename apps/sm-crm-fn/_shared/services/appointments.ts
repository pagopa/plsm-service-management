// =============================================================================
// APPOINTMENTS SERVICE - Gestione Appuntamenti su Dynamics 365
// =============================================================================

import type {
  Appointment,
  DynamicsList,
  CreateAppointmentRequest,
  AppointmentParty,
} from "../types/dynamics";
import { get, post, buildUrl } from "./httpClient";
import { getConfigOrThrow } from "../utils/config";

// -----------------------------------------------------------------------------
// Lista Appuntamenti
// -----------------------------------------------------------------------------

export async function listAppointments(params?: {
  filter?: string;
  select?: string;
  top?: string;
}): Promise<DynamicsList<Appointment>> {
  const url = buildUrl({
    endpoint: "/api/data/v9.2/appointments",
    filter: params?.filter,
    select:
      params?.select ??
      "activityid,subject,scheduledstart,scheduledend,location,description,statecode,statuscode,nextstep",
    top: params?.top,
  });

  console.log(`[Appointments] Fetching appointments from: ${url}`);
  return get<Appointment>(url);
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
  nextstep?: string;
  dataProssimoContatto?: string;
  accountId: string;
  contactIds: string[];
  ownerId?: string;
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
 * @param params.nextstep - Prossimi passi
 * @returns Appuntamento creato con activityid
 */
export async function createAppointment(
  params: CreateFullAppointmentParams
): Promise<Appointment> {
  const cfg = getConfigOrThrow();
  const url = `${cfg.DYNAMICS_BASE_URL}/api/data/v9.2/appointments`;

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
    nextstep: params.nextstep,
    "regardingobjectid_account@odata.bind": `/accounts(${params.accountId})`,
    appointment_activity_parties: activityParties,
  };

  // Aggiungi owner se specificato
  if (params.ownerId) {
    body["ownerid@odata.bind"] = `/systemusers(${params.ownerId})`;
  }

  // Aggiungi data prossimo contatto se specificata
  if (params.dataProssimoContatto) {
    body.new_dataprossimocontatto = params.dataProssimoContatto;
  }

  console.log(`[Appointments] Creazione appuntamento: ${params.subject}`);
  console.log(`[Appointments] Partecipanti: ${params.contactIds.length} contatti + 1 account`);

  const result = await post<CreateAppointmentRequest, Appointment>(url, body);

  console.log(`[Appointments] Appuntamento creato: ${result.activityid}`);
  return result;
}

// -----------------------------------------------------------------------------
// Get Appuntamento by ID
// -----------------------------------------------------------------------------

export async function getAppointmentById(
  activityId: string
): Promise<Appointment | null> {
  const url = buildUrl({
    endpoint: `/api/data/v9.2/appointments(${activityId})`,
    select:
      "activityid,subject,scheduledstart,scheduledend,location,description,statecode,statuscode,nextstep",
  });

  console.log(`[Appointments] Fetching appointment: ${activityId}`);

  try {
    const result = await get<Appointment>(url);
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

export async function listAppointmentsByContact(
  contactId: string
): Promise<DynamicsList<Appointment>> {
  return listAppointments({
    filter: `_regardingobjectid_value eq ${contactId}`,
  });
}

// -----------------------------------------------------------------------------
// Lista Appuntamenti per Account
// -----------------------------------------------------------------------------

export async function listAppointmentsByAccount(
  accountId: string
): Promise<DynamicsList<Appointment>> {
  return listAppointments({
    filter: `_regardingobjectid_value eq ${accountId}`,
  });
}
