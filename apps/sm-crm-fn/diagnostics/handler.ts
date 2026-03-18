import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getConfigOrThrow } from "../_shared/utils/config";
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
      .filter((e) => (e["LogicalName"] as string)?.startsWith("pgp_"))
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
    });

    // Step 2: lista tutte le entità pgp_ dai metadati di Dynamics
    const metadata = await probeMetadata(baseUrl);
    logger.info("Metadata probe result", {
      count: metadata.pgpEntities.length,
    });

    // Step 2: proba i candidati noti come fallback
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
        logger.info(`Candidate probe succeeded`, { candidate });
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
        logger.warn(`Candidate probe failed`, { candidate, statusCode });
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

    logger.info("Diagnostics probe completed", { environment, recommendation });

    return {
      status: 200,
      jsonBody: {
        environment,
        dynamicsBaseUrl: baseUrl,
        ...(accountLookup !== undefined && { accountLookup }),
        contactProductRelationships: contactProductRel,
        metadata,
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
