import { z, ZodError } from "zod";

const configSchema = z.object({
  DYNAMICS_BASE_URL: z
    .string()
    .url("DYNAMICS_BASE_URL deve essere un URL valido")
    .min(1, "Il base URL non puo essere una stringa vuota"),
  DYNAMICS_BASE_URL_UAT: z
    .string()
    .url("DYNAMICS_BASE_URL_UAT deve essere un URL valido")
    .min(1, "Il base URL UAT non puo essere una stringa vuota"),
  DYNAMICS_URL_CONTACTS: z
    .string()
    .url("DYNAMICS_URL_CONTACTS deve essere un URL valido")
    .min(1, "L'URL Dynamics non puo essere una stringa vuota")
    .optional(),
  DYNAMICS_URL_CONTACTS_UAT: z
    .string()
    .url("DYNAMICS_URL_CONTACTS_UAT deve essere un URL valido")
    .min(1, "L'URL Dynamics UAT non puo essere una stringa vuota")
    .optional(),
  DYNAMICS_SCOPE: z.string().min(1).optional(),
  NODE_ENV: z
    .string()
    .min(1, "L'ambiente di esecuzione non puo essere una stringa vuota")
    .default("production"),
  ENABLE_EMAIL_FORMAT_VALIDATION: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true"),
});

export type AppConfig = z.infer<typeof configSchema>;

export function validateConfig(config: unknown): AppConfig {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new Error(`Configurazione non valida: ${errorMessages}`);
    }
    throw new Error(
      "Errore sconosciuto durante la validazione della configurazione.",
    );
  }
}

export function getConfigOrThrow(): AppConfig {
  const raw = {
    DYNAMICS_BASE_URL: process.env.DYNAMICS_BASE_URL,
    DYNAMICS_BASE_URL_UAT: process.env.DYNAMICS_BASE_URL_UAT,
    DYNAMICS_URL_CONTACTS: process.env.DYNAMICS_URL_CONTACTS,
    DYNAMICS_URL_CONTACTS_UAT: process.env.DYNAMICS_URL_CONTACTS_UAT,
    DYNAMICS_SCOPE: process.env.DYNAMICS_SCOPE,
    NODE_ENV: process.env.NODE_ENV,
    ENABLE_EMAIL_FORMAT_VALIDATION: process.env.ENABLE_EMAIL_FORMAT_VALIDATION,
  };
  try {
    return validateConfig(raw);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `ERRORE CRITICO: Configurazione non valida. Dettagli: ${msg}`,
    );
  }
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}
