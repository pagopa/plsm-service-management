import { z, ZodError } from "zod";

// Schema di configurazione migliorato:
// - port: Converte la stringa in un numero e si assicura che sia positivo.
// - host: Si assicura che non sia una stringa vuota.
const configSchema = z.object({
  port: z.preprocess(
    (val) => Number(String(val).trim()),
    z
      .number()
      .int()
      .positive({ message: "Il numero di porta deve essere positivo." })
  ),
  host: z.string().min(1, "L'host non può essere una stringa vuota"),
  dbname: z
    .string()
    .min(1, "Il name del database non può essere una stringa vuota"),
  dbtable: z
    .string()
    .min(1, "Il name della tabella non può essere una stringa vuota"),
  dbuser: z
    .string()
    .min(1, "Il name dell'utente non può essere una stringa vuota"),
  dbpassword: z.string().min(1, "La password non può essere una stringa vuota"),
  dbssl: z.preprocess(
    (val) => String(val).trim().toLowerCase() === "true",
    z.boolean()
  ),
});

// Esporta il tipo TypeScript inferito automaticamente da Zod.
// Ora avrai l'autocompletamento e il type-checking sulla tua configurazione!
export type AppConfig = z.infer<typeof configSchema>;

/**
 * Valida un oggetto di configurazione sconosciuto usando lo schema Zod.
 * @param config L'oggetto di configurazione da validare.
 * @returns L'oggetto di configurazione validato e tipizzato.
 * @throws {Error} Se la validazione fallisce, lancia un errore con un messaggio chiaro.
 */
function validateConfig(config: unknown): AppConfig {
  try {
    // .parse() valida e, se ha successo, restituisce i dati tipizzati.
    // Se fallisce, lancia un errore che viene catturato dal blocco catch.
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      // Formatta gli errori di Zod in un messaggio più leggibile.
      const errorMessages = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new Error(`Configurazione non valida: ${errorMessages}`);
    }
    // Lancia di nuovo qualsiasi altro tipo di errore imprevisto.
    throw new Error(
      "Errore sconosciuto durante la validazione della configurazione."
    );
  }
}

export function getConfigOrThrow() {
  let configValues: AppConfig;

  try {
    // Raccogli la configurazione, ad esempio dalle variabili d'ambiente
    const configFromEnv = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dbname: process.env.DB_NAME,
      dbuser: process.env.DB_USER,
      dbpassword: process.env.DB_PASSWORD,
      dbssl: process.env.DB_SSL,
    };

    // Valida la configurazione
    configValues = validateConfig(configFromEnv);

    return configValues;
  } catch (error) {
    let errorMessage = "Errore sconosciuto durante la validazione.";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(
      `ERRORE CRITICO: Configurazione non valida. Dettagli: ${errorMessage}`
    );
  }
}
