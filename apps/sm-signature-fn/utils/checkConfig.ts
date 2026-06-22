import { z, ZodError } from "zod";

const configSchema = z.object({
  dssApiBaseUrl: z
    .string()
    .min(1, "DSS_API_BASE_URL non può essere vuoto")
    .url("DSS_API_BASE_URL deve essere un URL valido"),
  maxFileSizeBytes: z.preprocess(
    (val) => (val === undefined ? 10 * 1024 * 1024 : Number(String(val).trim())),
    z.number().int().positive("MAX_FILE_SIZE_BYTES deve essere positivo"),
  ),
});

export type AppConfig = z.infer<typeof configSchema>;

function validateConfig(config: unknown): AppConfig {
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
  return validateConfig({
    dssApiBaseUrl: process.env.DSS_API_BASE_URL,
    maxFileSizeBytes: process.env.MAX_FILE_SIZE_BYTES,
  });
}
