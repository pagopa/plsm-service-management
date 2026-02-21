// =============================================================================
// DYNAMICS TYPES - Tipi per l'integrazione con Microsoft Dynamics 365
// =============================================================================

export interface DynamicsList<T> {
  value: T[];
  "@odata.nextLink"?: string;
  "@odata.count"?: number;
}

// -----------------------------------------------------------------------------
// Entità base
// -----------------------------------------------------------------------------

export interface Account {
  accountid: string;
  name?: string;
  pgp_identificativoselfcare?: string;
  pgp_denominazioneselfcare?: string;
  pgp_codicefiscaleselfcare?: string;
  emailaddress1?: string;
  telephone1?: string;
  address1_composite?: string;
  statecode?: number;
  statuscode?: number;
}

export interface Contact {
  contactid: string;
  fullname?: string;
  emailaddress1?: string;
  firstname?: string;
  lastname?: string;
  telephone1?: string;
  pgp_identificativoselfcarecliente?: string;
  pgp_identificativoidpagopa?: string;
  _pgp_prodottoid_value?: string;
  _parentcustomerid_value?: string;
  pgp_tipologiareferente?: number;
}

export interface Appointment {
  activityid: string;
  subject?: string;
  scheduledstart?: string;
  scheduledend?: string;
  location?: string;
  description?: string;
  statecode?: number;
  statuscode?: number;
  nextstep?: string;
  new_dataprossimocontatto?: string;
}

// -----------------------------------------------------------------------------
// Request per creazione entità
// -----------------------------------------------------------------------------

export interface CreateContactRequest {
  firstname: string;
  lastname: string;
  emailaddress1: string;
  pgp_tipologiareferente: number;
  // Navigation Properties for lookups (use @odata.bind)
  "parentcustomerid_account@odata.bind": string;
  "pgp_ProdottoId@odata.bind"?: string; // Optional - correct Navigation Property name unknown
}

export interface CreateAppointmentRequest {
  subject: string;
  scheduledstart: string;
  scheduledend: string;
  location?: string;
  description?: string;
  statuscode?: number;
  nextstep?: string;
  new_dataprossimocontatto?: string;
  "ownerid@odata.bind"?: string;
  "regardingobjectid_account@odata.bind"?: string;
  appointment_activity_parties?: AppointmentParty[];
}

export interface AppointmentParty {
  participationtypemask: number;
  "partyid_contact@odata.bind"?: string;
  "partyid_account@odata.bind"?: string;
}

export interface GrantAccessRequest {
  Principal: {
    "teamid@odata.bind": string;
  };
  AccessMask:
    | "ReadAccess"
    | "WriteAccess"
    | "AppendAccess"
    | "AppendToAccess"
    | "CreateAccess"
    | "DeleteAccess"
    | "ShareAccess"
    | "AssignAccess";
}

// -----------------------------------------------------------------------------
// Errori Dynamics
// -----------------------------------------------------------------------------

export interface DynamicsError {
  error: {
    code: string;
    message: string;
    innererror?: {
      message: string;
      type: string;
      stacktrace: string;
    };
  };
}

// -----------------------------------------------------------------------------
// Orchestrator Types
// -----------------------------------------------------------------------------

export interface Partecipante {
  email: string;
  nome?: string;
  cognome?: string;
  tipologiaReferente?: TipologiaReferente;
}

export interface CreateMeetingOrchestratorRequest {
  // Identificazione Ente
  institutionIdSelfcare?: string;
  nomeEnte?: string;
  enableFallback?: boolean;
  enableCreateContact?: boolean;

  // Prodotto
  productIdSelfcare: string;

  // Partecipanti
  partecipanti: Partecipante[];

  // Dati appuntamento
  subject: string;
  scheduledstart: string;
  scheduledend: string;
  location?: string;
  description?: string;
  nextstep?: string;
  dataProssimoContatto?: string;

  // Opzioni
  dryRun?: boolean;
}

export interface OrchestratorStepResult {
  step: string;
  success: boolean;
  data?: unknown;
  error?: string;
  skipped?: boolean;
  dryRun?: boolean;
}

export interface CreateMeetingOrchestratorResponse {
  success: boolean;
  dryRun: boolean;
  activityId?: string;
  accountId?: string;
  contactIds?: string[];
  steps: OrchestratorStepResult[];
  warnings: string[];
  timestamp: string;
}

// -----------------------------------------------------------------------------
// Enums e Mapping
// -----------------------------------------------------------------------------

export type TipologiaReferente =
  | "APICALE"
  | "DIRETTO"
  | "TECNICO"
  | "BUSINESS"
  | "ACCOUNT"
  | "RESPONSABILE_DI_TRASFORMAZIONE_DIGITALE"
  | "REFERENTE_CONTRATTUALE"
  | "RESPONSABILE_PROTEZIONE_DATI"
  | "REFERENTE_BUSINESS_APICALE_ACCOUNT";

export type ProductIdSelfcare =
  | "prod-pn"
  | "prod-io"
  | "prod-pagopa"
  | "prod-idpay"
  | "prod-idpay-merchant"
  | "prod-checkiban"
  | "prod-interop"
  | "prod-io-premium"
  | "prod-io-sign"
  | "prod-rtp";

export type Environment = "DEV" | "UAT" | "PROD";
