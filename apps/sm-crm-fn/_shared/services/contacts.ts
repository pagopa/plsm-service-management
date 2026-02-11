// =============================================================================
// CONTACTS SERVICE - Gestione Contatti su Dynamics 365
// =============================================================================

import type {
  Contact,
  DynamicsList,
  CreateContactRequest,
  TipologiaReferente,
  ProductIdSelfcare,
} from "../types/dynamics";
import { get, post, buildUrl } from "./httpClient";
import {
  getProductGuid,
  getTipologiaReferenteId,
  resolveEnvironment,
} from "../utils/mappings";
import { getConfigOrThrow } from "../utils/config";

// -----------------------------------------------------------------------------
// Lista Contatti (usato da ping e altre utility)
// -----------------------------------------------------------------------------

export async function listContacts(params?: {
  filter?: string;
  select?: string;
  top?: string;
}): Promise<DynamicsList<Contact>> {
  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter: params?.filter,
    select:
      params?.select ?? "contactid,fullname,emailaddress1,firstname,lastname",
    top: params?.top,
  });

  console.log(`[Contacts] Fetching contacts from: ${url}`);
  return get<Contact>(url);
}

// -----------------------------------------------------------------------------
// Get Contatto by ID
// -----------------------------------------------------------------------------

export async function getContactById(
  contactId: string,
): Promise<Contact | null> {
  const url = buildUrl({
    endpoint: `/api/data/v9.2/contacts(${contactId})`,
    select: "contactid,fullname,emailaddress1,firstname,lastname,telephone1",
  });

  console.log(`[Contacts] Fetching contact: ${contactId}`);

  try {
    const result = await get<Contact>(url);
    return result.value?.[0] ?? (result as unknown as Contact);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("404")) {
      return null;
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Cerca Contatti per Email
// -----------------------------------------------------------------------------

export async function searchContactsByEmail(
  email: string,
): Promise<DynamicsList<Contact>> {
  return listContacts({
    filter: `emailaddress1 eq '${email}'`,
  });
}

// -----------------------------------------------------------------------------
// Cerca Contatti per Account ID (Ente)
// -----------------------------------------------------------------------------

/**
 * Recupera tutti i contatti associati a un Ente (Account).
 *
 * @param accountId - GUID dell'account in Dynamics
 * @returns Lista di contatti associati all'ente
 */
export async function getContactsByAccountId(
  accountId: string,
): Promise<DynamicsList<Contact>> {
  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter: `_parentcustomerid_value eq ${accountId}`,
    select:
      "contactid,fullname,emailaddress1,firstname,lastname,telephone1,pgp_identificativoselfcarecliente,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente",
  });

  console.log(`[Contacts] Ricerca contatti per Account ID: ${accountId}`);

  const result = await get<Contact>(url);

  console.log(
    `[Contacts] Trovati ${result.value?.length ?? 0} contatti per Account ID: ${accountId}`,
  );

  return result;
}

// =============================================================================
// CONTACTS
// =============================================================================

/**
 * Cerca un Contatto in Dynamics per email, ente e prodotto.
 */
export async function getContactByEmailAndInstitution(
  email: string,
  institutionIdSelfcare: string,
  productIdSelfcare: string,
): Promise<Contact | null> {
  const escapedEmail = email.replace(/'/g, "''");

  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter: `pgp_identificativoselfcarecliente eq '${institutionIdSelfcare}' and emailaddress1 eq '${escapedEmail}' and contains(pgp_identificativoidpagopa, '${productIdSelfcare}')`,
    select:
      "contactid,fullname,emailaddress1,firstname,lastname,telephone1,pgp_identificativoselfcarecliente,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente",
  });

  console.log(
    `[Contacts] Ricerca contatto: ${email} per ente ${institutionIdSelfcare}`,
  );

  const result = await get<Contact>(url);

  if (!result.value || result.value.length === 0) {
    console.log(`[Contacts] Nessun contatto trovato per email: ${email}`);
    return null;
  }

  console.log(
    `[Contacts] Contatto trovato: ${result.value[0].fullname} (${result.value[0].contactid})`,
  );
  return result.value[0];
}

/**
 * Cerca un Contatto in Dynamics per email e GUID prodotto (fallback).
 */
export async function getContactByEmailAndProduct(
  email: string,
  productGuidCRM: string,
): Promise<Contact | null> {
  const escapedEmail = email.replace(/'/g, "''");

  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter: `emailaddress1 eq '${escapedEmail}' and _pgp_prodottoid_value eq '${productGuidCRM}'`,
    select:
      "contactid,fullname,emailaddress1,firstname,lastname,telephone1,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente",
  });

  console.log(
    `[Contacts] Ricerca contatto (fallback): ${email} per prodotto ${productGuidCRM}`,
  );

  const result = await get<Contact>(url);

  if (!result.value || result.value.length === 0) {
    console.log(
      `[Contacts] Nessun contatto trovato (fallback) per email: ${email}`,
    );
    return null;
  }

  console.log(
    `[Contacts] Contatto trovato (fallback): ${result.value[0].fullname} (${result.value[0].contactid})`,
  );
  return result.value[0];
}

// -----------------------------------------------------------------------------
// Endpoint 5: Crea Contatto
// -----------------------------------------------------------------------------

export interface CreateContactParams {
  firstname: string;
  lastname: string;
  email: string;
  productIdSelfcare: ProductIdSelfcare;
  tipologiaReferente: TipologiaReferente;
  accountId: string;
}

export async function createContact(
  params: CreateContactParams,
): Promise<Contact> {
  const cfg = getConfigOrThrow();
  const environment = resolveEnvironment(cfg.DYNAMICS_BASE_URL);

  const productGuid = getProductGuid(params.productIdSelfcare, environment);
  if (!productGuid) {
    throw new Error(
      `Prodotto ${params.productIdSelfcare} non valido per ambiente ${environment}`,
    );
  }

  const tipologiaId = getTipologiaReferenteId(params.tipologiaReferente);
  const url = `${cfg.DYNAMICS_BASE_URL}/api/data/v9.2/contacts`;

  const body: CreateContactRequest = {
    firstname: params.firstname,
    lastname: params.lastname,
    emailaddress1: params.email,
    _pgp_prodottoid_value: productGuid,
    pgp_tipologiareferente: tipologiaId,
    _parentcustomerid_value: params.accountId,
  };

  console.log(
    `[Contacts] Creazione contatto: ${params.firstname} ${params.lastname} <${params.email}>`,
  );

  const result = await post<CreateContactRequest, Contact>(url, body);

  console.log(`[Contacts] Contatto creato: ${result.contactid}`);
  return result;
}

// -----------------------------------------------------------------------------
// Verifica/Crea Contatto (orchestratore)
// -----------------------------------------------------------------------------

export interface VerifyOrCreateContactParams {
  email: string;
  nome?: string;
  cognome?: string;
  institutionIdSelfcare?: string;
  productIdSelfcare: ProductIdSelfcare;
  tipologiaReferente: TipologiaReferente;
  accountId: string;
  enableCreateContact: boolean;
}

export interface VerifyOrCreateContactResult {
  found: boolean;
  created: boolean;
  contact: Contact | null;
  error?: string;
}

export async function verifyOrCreateContact(
  params: VerifyOrCreateContactParams,
): Promise<VerifyOrCreateContactResult> {
  const cfg = getConfigOrThrow();
  const environment = resolveEnvironment(cfg.DYNAMICS_BASE_URL);
  const productGuid = getProductGuid(params.productIdSelfcare, environment);

  if (params.institutionIdSelfcare) {
    const contact = await getContactByEmailAndInstitution(
      params.email,
      params.institutionIdSelfcare,
      params.productIdSelfcare,
    );
    if (contact) {
      return { found: true, created: false, contact };
    }
  }

  if (productGuid) {
    const contact = await getContactByEmailAndProduct(
      params.email,
      productGuid,
    );
    if (contact) {
      return { found: true, created: false, contact };
    }
  }

  if (params.enableCreateContact) {
    if (!params.nome || !params.cognome) {
      return {
        found: false,
        created: false,
        contact: null,
        error: `Contatto ${params.email} non trovato e dati insufficienti per la creazione (nome/cognome mancanti)`,
      };
    }

    try {
      const newContact = await createContact({
        firstname: params.nome,
        lastname: params.cognome,
        email: params.email,
        productIdSelfcare: params.productIdSelfcare,
        tipologiaReferente: params.tipologiaReferente,
        accountId: params.accountId,
      });

      return { found: false, created: true, contact: newContact };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        found: false,
        created: false,
        contact: null,
        error: `Errore creazione contatto: ${msg}`,
      };
    }
  }

  return {
    found: false,
    created: false,
    contact: null,
    error: `Contatto ${params.email} non trovato e abilitazione alla creazione disattivata`,
  };
}
