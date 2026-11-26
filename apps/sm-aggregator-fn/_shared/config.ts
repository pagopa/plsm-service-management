import { z } from "zod";

/**
 * Configurazione della function, letta dalle app settings.
 * In dev e in locale AGGREGATOR_INCREMENT_MODE è "mock": l'invio a Selfcare
 * non parte mai. "live" solo in prod.
 */
const ConfigSchema = z.object({
  SELC_AGGREGATION_INCREMENT_URL: z.url(),
  SELC_AGGREGATION_INCREMENT_API_KEY: z.string().min(1),
  AGGREGATOR_INCREMENT_MODE: z.enum(["mock", "live"]).default("mock"),
});

export type AggregatorConfig = {
  incrementUrl: string;
  incrementApiKey: string;
  incrementMode: "mock" | "live";
};

export class ConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Configurazione non valida: ${missing.join(", ")}`);
    this.name = "ConfigError";
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AggregatorConfig {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const missing = [
      ...new Set(parsed.error.issues.map((issue) => String(issue.path[0]))),
    ];
    throw new ConfigError(missing);
  }
  return {
    incrementUrl: parsed.data.SELC_AGGREGATION_INCREMENT_URL,
    incrementApiKey: parsed.data.SELC_AGGREGATION_INCREMENT_API_KEY,
    incrementMode: parsed.data.AGGREGATOR_INCREMENT_MODE,
  };
}
