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
import { createLogger, logODataQuery, Timer } from "../utils/logger";

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
  const logger = createLogger(undefined, { accountId });
  const timer = new Timer();

  logger.info("🔍 Searching contacts by Account ID", { accountId });

  const filter = `_parentcustomerid_value eq '${accountId}'`;
  const select =
    "contactid,fullname,emailaddress1,firstname,lastname,telephone1,pgp_identificativoselfcarecliente,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente";

  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/contacts", filter, select);

  try {
    const result = await get<Contact>(url);
    const count = result.value?.length ?? 0;
    const duration = timer.elapsed();

    // Simple console log for Azure Log Stream visibility
    console.log(
      `[CONTACTS SEARCH RESULT] Found: ${count} contacts for accountId: ${accountId}`,
    );

    if (count === 0) {
      logger.warn("⚠️ No contacts found for Account ID", {
        accountId,
        duration,
        resultCount: 0,
      });
    } else {
      console.log(
        `[CONTACTS FOUND] Contacts: ${result.value?.map((c) => c.emailaddress1).join(", ")}`,
      );

      logger.info(`✅ Found ${count} contact(s) for Account ID`, {
        accountId,
        duration,
        resultCount: count,
        contacts: result.value?.map((c) => ({
          id: c.contactid,
          email: c.emailaddress1,
          name: c.fullname,
        })),
      });
    }

    return result;
  } catch (error) {
    logger.error("❌ Failed to fetch contacts by Account ID", error, {
      accountId,
      duration: timer.elapsed(),
    });
    throw error;
  }
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
  const logger = createLogger(undefined, {
    email,
    institutionId: institutionIdSelfcare,
    productId: productIdSelfcare,
  });
  const timer = new Timer();

  logger.info("🔍 Searching contact by email, institution and product", {
    email,
    institutionId: institutionIdSelfcare,
    productId: productIdSelfcare,
  });

  const escapedEmail = email.replace(/'/g, "''");
  const filter = `pgp_identificativoselfcarecliente eq '${institutionIdSelfcare}' and emailaddress1 eq '${escapedEmail}' and contains(pgp_identificativoidpagopa, '${productIdSelfcare}')`;
  const select =
    "contactid,fullname,emailaddress1,firstname,lastname,telephone1,pgp_identificativoselfcarecliente,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente";

  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/contacts", filter, select);

  try {
    const result = await get<Contact>(url);
    const duration = timer.elapsed();

    if (!result.value || result.value.length === 0) {
      logger.warn("⚠️ Contact not found by email and institution", {
        email,
        institutionId: institutionIdSelfcare,
        productId: productIdSelfcare,
        duration,
      });
      return null;
    }

    const contact = result.value[0];
    logger.info("✅ Contact found by email and institution", {
      contactId: contact.contactid,
      fullName: contact.fullname,
      email: contact.emailaddress1,
      duration,
    });

    return contact;
  } catch (error) {
    logger.error(
      "❌ Failed to search contact by email and institution",
      error,
      {
        email,
        institutionId: institutionIdSelfcare,
        duration: timer.elapsed(),
      },
    );
    throw error;
  }
}

/**
 * Cerca un Contatto in Dynamics per email e GUID prodotto (fallback).
 */
export async function getContactByEmailAndProduct(
  email: string,
  productGuidCRM: string,
): Promise<Contact | null> {
  const logger = createLogger(undefined, {
    email,
    productGuid: productGuidCRM,
  });
  const timer = new Timer();

  logger.info("🔍 Searching contact by email and product GUID (fallback)", {
    email,
    productGuid: productGuidCRM,
  });

  const escapedEmail = email.replace(/'/g, "''");
  const filter = `emailaddress1 eq '${escapedEmail}' and _pgp_prodottoid_value eq '${productGuidCRM}'`;
  const select =
    "contactid,fullname,emailaddress1,firstname,lastname,telephone1,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente";

  const url = buildUrl({
    endpoint: "/api/data/v9.2/contacts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/contacts", filter, select);

  try {
    const result = await get<Contact>(url);
    const duration = timer.elapsed();

    if (!result.value || result.value.length === 0) {
      logger.warn("⚠️ Contact not found by email and product (fallback)", {
        email,
        productGuid: productGuidCRM,
        duration,
      });
      return null;
    }

    const contact = result.value[0];
    logger.info("✅ Contact found by email and product (fallback)", {
      contactId: contact.contactid,
      fullName: contact.fullname,
      email: contact.emailaddress1,
      duration,
    });

    return contact;
  } catch (error) {
    logger.error("❌ Failed to search contact by email and product", error, {
      email,
      productGuid: productGuidCRM,
      duration: timer.elapsed(),
    });
    throw error;
  }
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
  const logger = createLogger(undefined, {
    email: params.email,
    accountId: params.accountId,
    productId: params.productIdSelfcare,
    institutionId: params.institutionIdSelfcare,
  });
  const overallTimer = new Timer();

  logger.info("🔄 Starting contact verification/creation flow", {
    email: params.email,
    enableCreateContact: params.enableCreateContact,
  });

  const cfg = getConfigOrThrow();
  const environment = resolveEnvironment(cfg.DYNAMICS_BASE_URL);
  const productGuid = getProductGuid(params.productIdSelfcare, environment);

  // Step 1: Search by institution
  if (params.institutionIdSelfcare) {
    logger.debug("Step 1: Searching by institution ID and product", {
      institutionId: params.institutionIdSelfcare,
    });

    const contact = await getContactByEmailAndInstitution(
      params.email,
      params.institutionIdSelfcare,
      params.productIdSelfcare,
    );

    if (contact) {
      logger.info("✅ Contact found by institution ID", {
        contactId: contact.contactid,
        duration: overallTimer.elapsed(),
      });
      return { found: true, created: false, contact };
    }

    logger.debug("Step 1 complete: Contact not found by institution");
  }

  // Step 2: Fallback search by product GUID
  if (productGuid) {
    logger.debug("Step 2: Fallback search by product GUID", { productGuid });

    const contact = await getContactByEmailAndProduct(
      params.email,
      productGuid,
    );

    if (contact) {
      logger.info("✅ Contact found by product GUID (fallback)", {
        contactId: contact.contactid,
        duration: overallTimer.elapsed(),
      });
      return { found: true, created: false, contact };
    }

    logger.debug("Step 2 complete: Contact not found by product GUID");
  }

  // Step 3: Create contact if enabled
  if (params.enableCreateContact) {
    logger.info("Step 3: Contact creation enabled, attempting to create", {
      hasNome: !!params.nome,
      hasCognome: !!params.cognome,
    });

    if (!params.nome || !params.cognome) {
      const error = `Contatto ${params.email} non trovato e dati insufficienti per la creazione (nome/cognome mancanti)`;
      logger.warn("⚠️ Cannot create contact: missing name/surname", {
        duration: overallTimer.elapsed(),
      });
      return {
        found: false,
        created: false,
        contact: null,
        error,
      };
    }

    try {
      logger.info("Creating new contact in Dynamics", {
        nome: params.nome,
        cognome: params.cognome,
      });

      const newContact = await createContact({
        firstname: params.nome,
        lastname: params.cognome,
        email: params.email,
        productIdSelfcare: params.productIdSelfcare,
        tipologiaReferente: params.tipologiaReferente,
        accountId: params.accountId,
      });

      logger.info("✅ Contact created successfully", {
        contactId: newContact.contactid,
        duration: overallTimer.elapsed(),
      });

      return { found: false, created: true, contact: newContact };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("❌ Failed to create contact", error, {
        duration: overallTimer.elapsed(),
      });
      return {
        found: false,
        created: false,
        contact: null,
        error: `Errore creazione contatto: ${msg}`,
      };
    }
  }

  // Contact not found and creation disabled
  const error = `Contatto ${params.email} non trovato e abilitazione alla creazione disattivata`;
  logger.warn("⚠️ Contact not found and creation is disabled", {
    duration: overallTimer.elapsed(),
  });

  return {
    found: false,
    created: false,
    contact: null,
    error,
  };
}
