import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getConfigOrThrow } from "../_shared/utils/config";
import { resolveEnvironment, PRODUCTS_MAP } from "../_shared/utils/mappings";
import { get, buildUrl } from "../_shared/services/httpClient";
import { createLogger } from "../_shared/utils/logger";

type CandidateResult =
  | { success: true; count: number; sample: Record<string, unknown> }
  | { success: false; statusCode: number | undefined; error: string };

async function probeMetadata(): Promise<{
  pgpEntities: Array<{ logicalName: string; entitySetName: string }>;
  error: string | null;
}> {
  const url = buildUrl({
    endpoint: "/api/data/v9.2/EntityDefinitions",
    filter: "startswith(LogicalName, 'pgp_')",
    select: "LogicalName,EntitySetName",
  });

  try {
    const data = await get<Record<string, unknown>>(url);
    const pgpEntities = (data.value ?? []).map((e) => ({
      logicalName: e["LogicalName"] as string,
      entitySetName: e["EntitySetName"] as string,
    }));
    return { pgpEntities, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { pgpEntities: [], error: errorMessage };
  }
}

export async function probeDynamicsHandler(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createLogger(context);
  const cfg = getConfigOrThrow();
  const environment = resolveEnvironment(cfg.DYNAMICS_BASE_URL);

  logger.info("Diagnostics probe started", { environment });

  // Step 1: lista tutte le entità pgp_ dai metadati di Dynamics
  const metadata = await probeMetadata();
  logger.info("Metadata probe result", { count: metadata.pgpEntities.length });

  // Step 2: proba i candidati noti come fallback
  const candidates = ["pgp_prodotti", "pgp_products"] as const;
  const results: Record<string, CandidateResult> = {};

  for (const candidate of candidates) {
    const url = buildUrl({
      endpoint: `/api/data/v9.2/${candidate}`,
      top: "1",
    });

    try {
      const data = await get<Record<string, unknown>>(url);
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
      const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
      results[candidate] = {
        success: false,
        statusCode,
        error: errorMessage,
      };
      logger.warn(`Candidate probe failed`, { candidate, statusCode });
    }
  }

  const prodottoEntity = metadata.pgpEntities.find((e) =>
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
      dynamicsBaseUrl: cfg.DYNAMICS_BASE_URL,
      metadata,
      recommendation,
      products: PRODUCTS_MAP[environment],
      candidates: results,
    },
  };
}
