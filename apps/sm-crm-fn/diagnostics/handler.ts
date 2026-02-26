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

export async function probeDynamicsHandler(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createLogger(context);
  const cfg = getConfigOrThrow();
  const environment = resolveEnvironment(cfg.DYNAMICS_BASE_URL);

  logger.info("Diagnostics probe started", { environment });

  const candidates = ["pgp_prodottos", "pgp_prodottoes"] as const;
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

  const recommendation =
    candidates.find((c) => results[c]?.success === true) ?? null;

  logger.info("Diagnostics probe completed", { environment, recommendation });

  return {
    status: 200,
    jsonBody: {
      environment,
      dynamicsBaseUrl: cfg.DYNAMICS_BASE_URL,
      recommendation,
      products: PRODUCTS_MAP[environment],
      candidates: results,
    },
  };
}
