import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { resolveEnvironment, PRODUCTS_MAP } from "../_shared/utils/mappings";
import { get, buildUrl } from "../_shared/services/httpClient";
import { createLogger } from "../_shared/utils/logger";
import {
  resolveDynamicsEnvironment,
  getDynamicsBaseUrl,
} from "../_shared/utils/requestEnvironment";

type CandidateResult =
  | { success: true; count: number; sample: Record<string, unknown> }
  | { success: false; statusCode: number | undefined; error: string };

async function probeMetadata(baseUrl: string): Promise<{
  pgpEntities: Array<{ logicalName: string; entitySetName: string }>;
  error: string | null;
}> {
  const url = buildUrl({
    baseUrl,
    endpoint: "/api/data/v9.2/EntityDefinitions",
    select: "LogicalName,EntitySetName",
  });

  try {
    const data = await get<Record<string, unknown>>(url, baseUrl);
    const pgpEntities = (data.value ?? [])
      .filter(
        (e) =>
          typeof e["LogicalName"] === "string" &&
          (e["LogicalName"] as string).startsWith("pgp_"),
      )
      .map((e) => ({
        logicalName: e["LogicalName"] as string,
        entitySetName: e["EntitySetName"] as string,
      }));
    return { pgpEntities, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { pgpEntities: [], error: errorMessage };
  }
}

async function probeContactProductRelationship(baseUrl: string): Promise<{
  relationships: Array<{
    schemaName: string;
    referencingNavigationPropertyName: string;
    referencedEntity: string;
  }>;
  error: string | null;
}> {
  // Cerca tutte le ManyToOne relationships del contact verso entità che contengono "product"
  const url = buildUrl({
    baseUrl,
    endpoint:
      "/api/data/v9.2/EntityDefinitions(LogicalName='contact')/ManyToOneRelationships",
    select:
      "SchemaName,ReferencingEntityNavigationPropertyName,ReferencedEntity",
  });

  try {
    const data = await get<Record<string, unknown>>(url, baseUrl);
    const relationships = (data.value ?? [])
      .filter((r) => (r["ReferencedEntity"] as string)?.includes("product"))
      .map((r) => ({
        schemaName: r["SchemaName"] as string,
        referencingNavigationPropertyName: r[
          "ReferencingEntityNavigationPropertyName"
        ] as string,
        referencedEntity: r["ReferencedEntity"] as string,
      }));
    return { relationships, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { relationships: [], error: errorMessage };
  }
}

/**
 * Risultato della validazione di un singolo campo su Dynamics 365.
 */
interface FieldValidationEntry {
  logicalName: string;
  attributeType: string;
  expected: boolean;
  found: boolean;
  /** Se true, il campo è un navigation property e non compare tra gli Attributes standard */
  isNavigationProperty?: boolean;
}

/**
 * Risultato complessivo della validazione dei campi di un'entità Dynamics 365.
 */
interface EntityFieldProbeResult {
  entity: string;
  fields: FieldValidationEntry[];
  /** Campi attesi ma non trovati tra gli Attributes di Dynamics (esclusi i navigation property) */
  missing: string[];
  /** Navigation property dichiarati esplicitamente: non vengono inclusi in missing */
  navigationProperties: string[];
  error: string | null;
}

/**
 * Verifica l'esistenza dei campi (Attributes) di una specifica entità in Dynamics 365
 * tramite l'API OData dei metadati.
 *
 * I navigation property (es. lookup come `pgp_Prodottoid`) non compaiono tra gli Attributes
 * standard: devono essere dichiarati esplicitamente tramite il parametro `navigationPropertyFields`
 * e vengono esclusi dal conteggio dei campi mancanti.
 *
 * @param baseUrl - URL base dell'ambiente Dynamics (es. https://org.crm4.dynamics.com)
 * @param entityLogicalName - Nome logico dell'entità da interrogare (es. 'appointment', 'contact')
 * @param expectedFields - Lista dei nomi logici dei campi standard attesi
 * @param navigationPropertyFields - Lista dei navigation property da segnalare separatamente
 * @returns Oggetto contenente l'elenco dei campi con flag expected/found, la lista dei missing e dei navigation property
 */
async function probeEntityFields(
  baseUrl: string,
  entityLogicalName: string,
  expectedFields: string[],
  navigationPropertyFields: string[] = [],
): Promise<EntityFieldProbeResult> {
  const url = buildUrl({
    baseUrl,
    endpoint: `/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes`,
    select: "LogicalName,AttributeType",
  });

  try {
    const data = await get<Record<string, unknown>>(url, baseUrl);
    const attributes = data.value ?? [];

    // Costruisce la mappa case-insensitive dei campi trovati (solo quelli con LogicalName valido)
    const foundFieldsMap = new Map<string, string>();
    for (const attr of attributes) {
      const logicalName = attr["LogicalName"];
      const attributeType = attr["AttributeType"];
      if (
        typeof logicalName === "string" &&
        typeof attributeType === "string"
      ) {
        foundFieldsMap.set(logicalName.toLowerCase(), attributeType);
      }
    }

    // Costruisce l'elenco dei campi trovati con flag expected/found
    const fields: FieldValidationEntry[] = [];
    for (const attr of attributes) {
      const logicalName = attr["LogicalName"];
      const attributeType = attr["AttributeType"];
      if (typeof logicalName !== "string" || typeof attributeType !== "string")
        continue;

      const isExpected = expectedFields.some(
        (exp) => exp.toLowerCase() === logicalName.toLowerCase(),
      );
      if (isExpected) {
        fields.push({
          logicalName,
          attributeType,
          expected: true,
          found: true,
        });
      }
    }

    // Aggiunge i campi attesi ma non trovati (missing)
    const missing = expectedFields.filter(
      (exp) => !foundFieldsMap.has(exp.toLowerCase()),
    );

    // I navigation property vengono segnalati separatamente, non come missing
    const navigationProperties = navigationPropertyFields;

    return {
      entity: entityLogicalName,
      fields,
      missing,
      navigationProperties,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      entity: entityLogicalName,
      fields: [],
      missing: expectedFields,
      navigationProperties: navigationPropertyFields,
      error: errorMessage,
    };
  }
}

/**
 * Esegue in parallelo la validazione dei campi per le entità `appointment` e `contact`,
 * verificando l'esistenza di tutti i campi custom e standard utilizzati dall'applicazione.
 *
 * @param baseUrl - URL base dell'ambiente Dynamics
 * @returns Oggetto consolidato con i risultati di validazione per entrambe le entità
 */
async function probeFieldValidation(baseUrl: string): Promise<{
  appointment: EntityFieldProbeResult;
  contact: EntityFieldProbeResult;
}> {
  // Campi standard attesi per l'entità appointment
  const appointmentExpectedFields = [
    "pgp_oggettodelcontatto",
    "subject",
    "scheduledstart",
    "scheduledend",
    "location",
    "description",
    "statuscode",
    "statecode",
  ];

  // Campi standard attesi per l'entità contact
  const contactExpectedFields = [
    "emailaddress1",
    "firstname",
    "lastname",
    "pgp_tipologiareferente",
  ];

  // Navigation property di contact: sono lookup/relation e non compaiono tra gli Attributes
  const contactNavigationProperties = ["pgp_Prodottoid"];

  const [appointmentResult, contactResult] = await Promise.all([
    probeEntityFields(baseUrl, "appointment", appointmentExpectedFields),
    probeEntityFields(
      baseUrl,
      "contact",
      contactExpectedFields,
      contactNavigationProperties,
    ),
  ]);

  return {
    appointment: appointmentResult,
    contact: contactResult,
  };
}

async function lookupAccount(
  baseUrl: string,
  accountId: string,
): Promise<{
  accountid: string;
  name: string | null;
  pgp_identificativoselfcare: string | null;
} | null> {
  const url = buildUrl({
    baseUrl,
    endpoint: `/api/data/v9.2/accounts(${accountId})`,
    select: "accountid,name,pgp_identificativoselfcare",
  });

  try {
    const data = await get<Record<string, unknown>>(url, baseUrl);
    const account =
      data.value?.[0] ?? (data as unknown as Record<string, unknown>);
    return {
      accountid: account["accountid"] as string,
      name: (account["name"] as string) ?? null,
      pgp_identificativoselfcare:
        (account["pgp_identificativoselfcare"] as string) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Recupera i valori dell'OptionSet (Picklist) di un attributo specifico di un'entità Dynamics 365.
 *
 * Utilizza l'API dei metadati OData per ottenere i valori interi e le etichette
 * associate alla picklist, necessari per mappare stringhe UI → valori Dynamics.
 *
 * @param baseUrl - URL base dell'ambiente Dynamics (es. https://org.crm4.dynamics.com)
 * @param entityLogicalName - Nome logico dell'entità (es. 'appointment')
 * @param attributeLogicalName - Nome logico dell'attributo Picklist (es. 'pgp_oggettodelcontatto')
 * @returns Oggetto con i valori dell'OptionSet o un errore
 */
async function probePicklistValues(
  baseUrl: string,
  entityLogicalName: string,
  attributeLogicalName: string,
): Promise<{
  options: Array<{ value: number; label: string }>;
  error: string | null;
}> {
  const url = buildUrl({
    baseUrl,
    endpoint: `/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes(LogicalName='${attributeLogicalName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`,
    select: "OptionSet",
  });

  try {
    const response = await get<Record<string, unknown>>(url, baseUrl);
    // Per questo endpoint specifico, la risposta non ha 'value' ma i dati diretti
    const data =
      response.value?.[0] ?? (response as unknown as Record<string, unknown>);
    const optionSet = data["OptionSet"] as Record<string, unknown> | undefined;
    if (!optionSet) {
      return {
        options: [],
        error:
          "OptionSet non trovato nella risposta Dynamics — verificare che il campo sia di tipo Picklist",
      };
    }

    const rawOptions = (optionSet["Options"] ?? []) as Array<
      Record<string, unknown>
    >;

    const parsedOptions = rawOptions
      .filter((opt) => typeof opt["Value"] === "number")
      .map((opt) => {
        const value = opt["Value"] as number;
        const labelObj = opt["Label"] as Record<string, unknown> | undefined;
        const localizedLabels = (labelObj?.["LocalizedLabels"] ?? []) as Array<
          Record<string, unknown>
        >;
        // Cerca prima etichetta italiana (LanguageCode 1040), poi primo elemento disponibile
        const italianLabel = localizedLabels.find(
          (l) => l["LanguageCode"] === 1040,
        );
        const label =
          ((italianLabel ?? localizedLabels[0])?.["Label"] as
            | string
            | undefined) ?? String(value);
        return { value, label };
      });

    return { options: parsedOptions, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { options: [], error: errorMessage };
  }
}

export async function probeDynamicsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createLogger(context);

  try {
    // Resolve Dynamics environment from header
    const environment = resolveDynamicsEnvironment(request);
    const baseUrl = getDynamicsBaseUrl(environment);

    logger.info("Diagnostics probe started", { environment });

    // Lookup opzionale: ?accountId=<guid>
    const accountIdParam = request.query.get("accountId");
    let accountLookup: Awaited<ReturnType<typeof lookupAccount>> | undefined;
    if (accountIdParam) {
      accountLookup =
        (await lookupAccount(baseUrl, accountIdParam)) ?? undefined;
      logger.info("Account lookup result", {
        accountId: accountIdParam,
        found: accountLookup != null,
      });
    }

    // Step 1: relazioni ManyToOne del contact verso entità "product"
    const contactProductRel = await probeContactProductRelationship(baseUrl);
    logger.info("Contact→Product relationships found", {
      count: contactProductRel.relationships.length,
      error: contactProductRel.error,
    });

    // Step 2: lista tutte le entità pgp_ dai metadati di Dynamics
    const metadata = await probeMetadata(baseUrl);
    logger.info("Metadata probe result", {
      count: metadata.pgpEntities.length,
      error: metadata.error,
    });

    // Step 2b: proba i candidati noti come fallback per la entity dei prodotti
    const candidates = ["pgp_prodotti", "pgp_products"] as const;
    const results: Record<string, CandidateResult> = {};

    for (const candidate of candidates) {
      const url = buildUrl({
        baseUrl,
        endpoint: `/api/data/v9.2/${candidate}`,
        top: "1",
      });

      try {
        const data = await get<Record<string, unknown>>(url, baseUrl);
        const sample = data.value?.[0] ?? {};
        results[candidate] = {
          success: true,
          count: data.value?.length ?? 0,
          sample,
        };
        logger.info("Candidate probe succeeded", { candidate });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const statusMatch = errorMessage.match(/failed: (\d+)/);
        const statusCode = statusMatch
          ? parseInt(statusMatch[1], 10)
          : undefined;
        results[candidate] = {
          success: false,
          statusCode,
          error: errorMessage,
        };
        logger.warn("Candidate probe failed", { candidate, statusCode });
      }
    }

    const prodottoEntity = metadata.pgpEntities.find(
      (e) =>
        e.logicalName.includes("prodotto") || e.logicalName.includes("product"),
    );

    const recommendation =
      prodottoEntity?.entitySetName ??
      candidates.find((c) => results[c]?.success === true) ??
      null;

    // Step 3: validazione dei campi per le entità appointment e contact
    const fieldValidation = await probeFieldValidation(baseUrl);
    logger.info("Field validation completed", {
      appointmentMissing: fieldValidation.appointment.missing,
      contactMissing: fieldValidation.contact.missing,
      appointmentFoundCount: fieldValidation.appointment.fields.length,
      contactFoundCount: fieldValidation.contact.fields.length,
      appointmentError: fieldValidation.appointment.error,
      contactError: fieldValidation.contact.error,
    });

    // Step 4: valori Picklist di pgp_oggettodelcontatto su appointment
    const oggettoDelContattoPicklist = await probePicklistValues(
      baseUrl,
      "appointment",
      "pgp_oggettodelcontatto",
    );
    logger.info("Picklist pgp_oggettodelcontatto probe", {
      optionCount: oggettoDelContattoPicklist.options.length,
      error: oggettoDelContattoPicklist.error,
    });

    logger.info("Diagnostics probe completed", { environment, recommendation });

    return {
      status: 200,
      jsonBody: {
        environment,
        dynamicsBaseUrl: baseUrl,
        ...(accountLookup !== undefined && { accountLookup }),
        contactProductRelationships: contactProductRel,
        metadata,
        fieldValidation,
        oggettoDelContattoPicklist,
        recommendation,
        products: PRODUCTS_MAP[environment],
        candidates: results,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Diagnostics probe failed", error);

    // Check for environment resolution errors
    if (errorMessage.includes("x-dynamics-environment")) {
      return {
        status: 400,
        jsonBody: {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      status: 500,
      jsonBody: {
        error: "Diagnostics probe failed",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
