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
  constructor(
    /** Variabili assenti o vuote: vanno aggiunte. */
    public readonly missing: string[],
    /** Variabili presenti ma con un valore non valido: vanno corrette. */
    public readonly invalid: string[],
  ) {
    const parts = [
      missing.length ? `mancanti: ${missing.join(", ")}` : "",
      invalid.length ? `non valide: ${invalid.join(", ")}` : "",
    ].filter(Boolean);
    super(`Configurazione non valida (${parts.join("; ")})`);
    this.name = "ConfigError";
  }
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): AggregatorConfig {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const keys = [
      ...new Set(parsed.error.issues.map((issue) => String(issue.path[0]))),
    ];
    const isMissing = (key: string) => !env[key];
    throw new ConfigError(
      keys.filter(isMissing),
      keys.filter((key) => !isMissing(key)),
    );
  }
  return {
    incrementUrl: parsed.data.SELC_AGGREGATION_INCREMENT_URL,
    incrementApiKey: parsed.data.SELC_AGGREGATION_INCREMENT_API_KEY,
    incrementMode: parsed.data.AGGREGATOR_INCREMENT_MODE,
  };
}
