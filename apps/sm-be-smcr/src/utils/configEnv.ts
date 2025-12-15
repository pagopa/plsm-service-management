import { z, ZodError } from 'zod';

const configSchema = z.object({
  PORT: z.preprocess(
    (val) => Number(String(val).trim() || '3000'),
    z.number().int().positive({ message: 'Il numero di porta deve essere positivo.' })
  ),
  DYNAMICS_BASE_URL: z
    .string()
    .min(1, 'Il base URL non può essere una stringa vuota')
    .default('https://dev-pagopa.crm4.dynamics.com'),
  DYNAMICS_URL: z
    .string()
    .min(1, "L'URL Dynamics non può essere una stringa vuota")
    .default('https://dev-pagopa.crm4.dynamics.com/api/data/v9.2/contacts'),
  DYNAMICS_SCOPE: z
    .string()
    .min(1, 'Lo Scope Dynamics non può essere una stringa vuota')
    .optional(),
  NODE_ENV: z
    .string()
    .min(1, "L'ambiente di esecuzione non può essere una stringa vuota")
    .default('development'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function validateConfig(config: unknown): AppConfig {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Configurazione non valida: ${errorMessages}`);
    }
    throw new Error('Errore sconosciuto durante la validazione della configurazione.');
  }
}

export function getConfigOrThrow(): AppConfig {
  const raw = {
    PORT: process.env.PORT,
    DYNAMICS_BASE_URL: process.env.DYNAMICS_BASE_URL,
    DYNAMICS_URL: process.env.DYNAMICS_URL,
    DYNAMICS_SCOPE: process.env.DYNAMICS_SCOPE,
    NODE_ENV: process.env.NODE_ENV,
  };
  try {
    return validateConfig(raw);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`ERRORE CRITICO: Configurazione non valida. Dettagli: ${msg}`);
  }
}
