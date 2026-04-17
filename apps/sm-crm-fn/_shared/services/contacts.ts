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
import { createLogger, logODataQuery, Timer } from "../utils/logger";
import type { DiagnosticSession } from "./diagnosticLogger";
import { addDiagnosticCall } from "./diagnosticLogger";

// -----------------------------------------------------------------------------
// Lista Contatti (usato da ping e altre utility)
// -----------------------------------------------------------------------------

export async function listContacts(
  baseUrl: string,
  params?: {
    filter?: string;
    select?: string;
    top?: string;
  },
): Promise<DynamicsList<Contact>> {
  const url = buildUrl({
    baseUrl,
    endpoint: "/api/data/v9.2/contacts",
    filter: params?.filter,
    select:
      params?.select ?? "contactid,fullname,emailaddress1,firstname,lastname",
    top: params?.top,
  });

  console.log(`[Contacts] Fetching contacts from: ${url}`);
  return get<Contact>(url, baseUrl);
}

// -----------------------------------------------------------------------------
// Get Contatto by ID
// -----------------------------------------------------------------------------

export async function getContactById(
  baseUrl: string,
  contactId: string,
): Promise<Contact | null> {
  const url = buildUrl({
    baseUrl,
    endpoint: `/api/data/v9.2/contacts(${contactId})`,
    select: "contactid,fullname,emailaddress1,firstname,lastname,telephone1",
  });

  console.log(`[Contacts] Fetching contact: ${contactId}`);

  try {
    const result = await get<Contact>(url, baseUrl);
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
  baseUrl: string,
  email: string,
): Promise<DynamicsList<Contact>> {
  const escapedEmail = email.replace(/'/g, "''");
  return listContacts(baseUrl, {
    filter: `emailaddress1 eq '${escapedEmail}'`,
  });
}

// -----------------------------------------------------------------------------
// Cerca Contatti per Account ID (Ente)
// -----------------------------------------------------------------------------

/**
 * Recupera tutti i contatti associati a un Ente (Account).
 *
 * @param baseUrl - Base URL per le chiamate Dynamics 365
 * @param accountId - GUID dell'account in Dynamics
 * @returns Lista di contatti associati all'ente
 */
export async function getContactsByAccountId(
  baseUrl: string,
  accountId: string,
): Promise<DynamicsList<Contact>> {
  const logger = createLogger(undefined, { accountId });
  const timer = new Timer();

  logger.info("🔍 Searching contacts by Account ID", { accountId });

  const filter = `_parentcustomerid_value eq '${accountId}'`;
  const select =
    "contactid,fullname,emailaddress1,firstname,lastname,telephone1,pgp_identificativoselfcarecliente,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente";

  const url = buildUrl({
    baseUrl,
    endpoint: "/api/data/v9.2/contacts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/contacts", filter, select);

  try {
    const result = await get<Contact>(url, baseUrl);
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
 *
 * @param baseUrl - Base URL per le chiamate Dynamics 365
 * @param email - Email del contatto
 * @param institutionIdSelfcare - ID Selfcare dell'ente
 * @param productIdSelfcare - ID Selfcare del prodotto
 * @returns Contatto trovato o null
 */
export async function getContactByEmailAndInstitution(
  baseUrl: string,
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
    baseUrl,
    endpoint: "/api/data/v9.2/contacts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/contacts", filter, select);

  try {
    const result = await get<Contact>(url, baseUrl);
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
 * Cerca un Contatto in Dynamics per sola email (fallback finale prima della creazione).
 *
 * @param baseUrl - Base URL per le chiamate Dynamics 365
 * @param email - Email del contatto
 * @returns Contatto trovato o null
 */
export async function getContactByEmailOnly(
  baseUrl: string,
  email: string,
): Promise<Contact | null> {
  const logger = createLogger(undefined, { email });
  const timer = new Timer();

  logger.info("🔍 Searching contact by email only (step 3 fallback)", {
    email,
  });

  const escapedEmail = email.replace(/'/g, "''");
  const filter = `emailaddress1 eq '${escapedEmail}'`;
  const select =
    "contactid,fullname,emailaddress1,firstname,lastname,telephone1,_pgp_prodottoid_value,_parentcustomerid_value,pgp_tipologiareferente";

  const url = buildUrl({
    baseUrl,
    endpoint: "/api/data/v9.2/contacts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/contacts", filter, select);

  try {
    const result = await get<Contact>(url, baseUrl);
    const duration = timer.elapsed();

    if (!result.value || result.value.length === 0) {
      logger.warn("⚠️ Contact not found by email only (step 3)", {
        email,
        duration,
      });
      return null;
    }

    const contact = result.value[0];
    logger.info("✅ Contact found by email only (step 3)", {
      contactId: contact.contactid,
      fullName: contact.fullname,
      email: contact.emailaddress1,
      duration,
    });

    return contact;
  } catch (error) {
    logger.error("❌ Failed to search contact by email only", error, {
      email,
      duration: timer.elapsed(),
    });
    throw error;
  }
}

/**
 * Cerca un Contatto in Dynamics per email e GUID prodotto (fallback).
 *
 * @param baseUrl - Base URL per le chiamate Dynamics 365
 * @param email - Email del contatto
 * @param productGuidCRM - GUID del prodotto in Dynamics
 * @returns Contatto trovato o null
 */
export async function getContactByEmailAndProduct(
  baseUrl: string,
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
    baseUrl,
    endpoint: "/api/data/v9.2/contacts",
    filter,
    select,
  });

  logODataQuery(logger, "/api/data/v9.2/contacts", filter, select);

  try {
    const result = await get<Contact>(url, baseUrl);
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
  email?: string;
  productIdSelfcare: ProductIdSelfcare;
  tipologiaReferente: TipologiaReferente;
  accountId: string;
}

export async function createContact(
  baseUrl: string,
  params: CreateContactParams,
): Promise<Contact> {
  const environment = resolveEnvironment(baseUrl);

  const productGuid = getProductGuid(params.productIdSelfcare, environment);
  if (!productGuid) {
    throw new Error(
      `Prodotto ${params.productIdSelfcare} non valido per ambiente ${environment}`,
    );
  }

  const tipologiaId = getTipologiaReferenteId(params.tipologiaReferente);
  const url = `${baseUrl}/api/data/v9.2/contacts`;

  const body: CreateContactRequest = {
    firstname: params.firstname,
    lastname: params.lastname,
    pgp_tipologiareferente: tipologiaId,
    "parentcustomerid_account@odata.bind": `/accounts(${params.accountId})`,
    "pgp_Prodottoid@odata.bind": `/products(${productGuid})`,
  };

  // Solo se email è presente
  if (params.email) {
    body.emailaddress1 = params.email;
  }

  console.log(
    `[Contacts] Creazione contatto: ${params.firstname} ${params.lastname}${params.email ? ` <${params.email}>` : ""}`,
  );

  const result = await post<CreateContactRequest, Contact>(url, body, baseUrl);

  console.log(`[Contacts] Contatto creato: ${result.contactid}`);
  return result;
}

// -----------------------------------------------------------------------------
// Verifica/Crea Contatto (orchestratore)
// -----------------------------------------------------------------------------

export interface VerifyOrCreateContactParams {
  baseUrl: string;
  email?: string;
  nome?: string;
  cognome?: string;
  institutionIdSelfcare?: string;
  productIdSelfcare: ProductIdSelfcare;
  tipologiaReferente: TipologiaReferente;
  accountId: string;
  enableCreateContact: boolean;
  /** Sessione diagnostica opzionale per il logging su Blob Storage */
  diagnosticSession?: DiagnosticSession;
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

  const environment = resolveEnvironment(params.baseUrl);
  const productGuid = getProductGuid(params.productIdSelfcare, environment);

  // Step 1: Search by institution (solo se email è presente)
  if (params.email && params.institutionIdSelfcare) {
    logger.debug("Step 1: Searching by institution ID and product", {
      institutionId: params.institutionIdSelfcare,
    });

    const step1Url = buildUrl({
      baseUrl: params.baseUrl,
      endpoint: "/api/data/v9.2/contacts",
      filter: `pgp_identificativoselfcarecliente eq '${params.institutionIdSelfcare}' and emailaddress1 eq '${params.email.replace(/'/g, "''")}' and contains(pgp_identificativoidpagopa, '${params.productIdSelfcare}')`,
      select: "contactid,fullname,emailaddress1,firstname,lastname",
    });
    const step1Start = Date.now();

    const contact = await getContactByEmailAndInstitution(
      params.baseUrl,
      params.email,
      params.institutionIdSelfcare,
      params.productIdSelfcare,
    );

    if (params.diagnosticSession) {
      addDiagnosticCall(params.diagnosticSession, {
        step: "searchContactByInstitution",
        method: "GET",
        url: step1Url,
        requestBody: null,
        responseStatus: 200,
        durationMs: Date.now() - step1Start,
      });
    }

    if (contact) {
      logger.info("✅ Contact found by institution ID", {
        contactId: contact.contactid,
        duration: overallTimer.elapsed(),
      });
      return { found: true, created: false, contact };
    }

    logger.debug("Step 1 complete: Contact not found by institution");
  }

  // Step 2: Fallback search by product GUID (solo se email è presente)
  if (params.email && productGuid) {
    logger.debug("Step 2: Fallback search by product GUID", { productGuid });

    const step2Url = buildUrl({
      baseUrl: params.baseUrl,
      endpoint: "/api/data/v9.2/contacts",
      filter: `emailaddress1 eq '${params.email.replace(/'/g, "''")}' and _pgp_prodottoid_value eq '${productGuid}'`,
      select: "contactid,fullname,emailaddress1,firstname,lastname",
    });
    const step2Start = Date.now();

    const contact = await getContactByEmailAndProduct(
      params.baseUrl,
      params.email,
      productGuid,
    );

    if (params.diagnosticSession) {
      addDiagnosticCall(params.diagnosticSession, {
        step: "searchContactByProduct",
        method: "GET",
        url: step2Url,
        requestBody: null,
        responseStatus: 200,
        durationMs: Date.now() - step2Start,
      });
    }

    if (contact) {
      logger.info("✅ Contact found by product GUID (fallback)", {
        contactId: contact.contactid,
        duration: overallTimer.elapsed(),
      });
      return { found: true, created: false, contact };
    }

    logger.debug("Step 2 complete: Contact not found by product GUID");
  }

  // Step 3: Fallback search by email only
  if (params.email) {
    logger.debug("Step 3: Fallback search by email only", {
      email: params.email,
    });

    const step3Url = buildUrl({
      baseUrl: params.baseUrl,
      endpoint: "/api/data/v9.2/contacts",
      filter: `emailaddress1 eq '${params.email.replace(/'/g, "''")}'`,
      select: "contactid,fullname,emailaddress1,firstname,lastname",
    });
    const step3Start = Date.now();

    const contact = await getContactByEmailOnly(params.baseUrl, params.email);

    if (params.diagnosticSession) {
      addDiagnosticCall(params.diagnosticSession, {
        step: "searchContactByEmailOnly",
        method: "GET",
        url: step3Url,
        requestBody: null,
        responseStatus: contact !== null ? 200 : 200,
        durationMs: Date.now() - step3Start,
      });
    }

    if (contact) {
      logger.info("✅ Contact found by email only (step 3 fallback)", {
        contactId: contact.contactid,
        duration: overallTimer.elapsed(),
      });
      return { found: true, created: false, contact };
    }

    logger.debug("Step 3 complete: Contact not found by email only");
  }

  // Step 4: Create contact if enabled
  if (params.enableCreateContact) {
    // Loggare warning se email è assente
    if (!params.email) {
      logger.warn("⚠️ Creating contact without email address", {
        hasNome: !!params.nome,
        hasCognome: !!params.cognome,
      });
    }

    logger.info("Step 4: Contact creation enabled, attempting to create", {
      hasNome: !!params.nome,
      hasCognome: !!params.cognome,
      hasEmail: !!params.email,
    });

    if (!params.nome || !params.cognome) {
      const error = `Contatto ${params.email ?? "(senza email)"} non trovato e dati insufficienti per la creazione (nome/cognome mancanti)`;
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
        email: params.email ?? "(no email)",
      });

      const createStart = Date.now();
      const newContact = await createContact(params.baseUrl, {
        firstname: params.nome,
        lastname: params.cognome,
        email: params.email,
        productIdSelfcare: params.productIdSelfcare,
        tipologiaReferente: params.tipologiaReferente,
        accountId: params.accountId,
      });

      if (params.diagnosticSession) {
        const environment = resolveEnvironment(params.baseUrl);
        const prodGuid = getProductGuid(params.productIdSelfcare, environment);
        const tipologiaId = getTipologiaReferenteId(params.tipologiaReferente);
        const contactBody: CreateContactRequest = {
          firstname: params.nome,
          lastname: params.cognome,
          pgp_tipologiareferente: tipologiaId,
          "parentcustomerid_account@odata.bind": `/accounts(${params.accountId})`,
          ...(prodGuid
            ? { "pgp_Prodottoid@odata.bind": `/products(${prodGuid})` }
            : {}),
          ...(params.email ? { emailaddress1: params.email } : {}),
        };
        addDiagnosticCall(params.diagnosticSession, {
          step: "createContact",
          method: "POST",
          url: `${params.baseUrl}/api/data/v9.2/contacts`,
          requestBody: contactBody,
          responseStatus: 201,
          durationMs: Date.now() - createStart,
        });
      }

      logger.info("✅ Contact created successfully", {
        contactId: newContact.contactid,
        duration: overallTimer.elapsed(),
      });

      return { found: false, created: true, contact: newContact };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (params.diagnosticSession) {
        addDiagnosticCall(params.diagnosticSession, {
          step: "createContact",
          method: "POST",
          url: `${params.baseUrl}/api/data/v9.2/contacts`,
          requestBody: null,
          responseStatus: null,
          durationMs: 0,
          error: msg,
        });
      }
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
  const error = `Contatto ${params.email ?? "(senza email)"} non trovato in nessuno dei 3 step di ricerca e abilitazione alla creazione disattivata`;
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
