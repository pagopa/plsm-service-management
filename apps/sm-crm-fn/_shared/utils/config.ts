import { z, ZodError } from "zod";

const configSchema = z.object({
  DYNAMICS_BASE_URL: z
    .string()
    .url("DYNAMICS_BASE_URL deve essere un URL valido")
    .min(1, "Il base URL non puo essere una stringa vuota"),
  DYNAMICS_BASE_URL_UAT: z
    .string()
    .url("DYNAMICS_BASE_URL_UAT deve essere un URL valido")
    .min(1, "Il base URL UAT non puo essere una stringa vuota")
    .optional(),
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
  // -----------------------------------------------------------------------------
  // Diagnostic Logging (Feature Flag)
  // Abilita il logging delle sessioni CRM su Azure Blob Storage.
  // Per attivare: DIAGNOSTIC_LOGGING_ENABLED=true
  // Per disattivare: DIAGNOSTIC_LOGGING_ENABLED=false (o rimuovere la variabile)
  // -----------------------------------------------------------------------------
  /**
   * Feature flag per il diagnostic logging su Blob Storage.
   * @default false
   */
  DIAGNOSTIC_LOGGING_ENABLED: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true"),
  /**
   * Connection string per Azure Blob Storage dove vengono scritti i log diagnostici.
   * Obbligatoria se DIAGNOSTIC_LOGGING_ENABLED=true, ignorata altrimenti.
   */
  DIAGNOSTIC_STORAGE_CONNECTION_STRING: z.string().optional(),
  /**
   * Nome del container Blob Storage per i log diagnostici.
   * @default "crm-diagnostics"
   */
  DIAGNOSTIC_STORAGE_CONTAINER: z
    .string()
    .optional()
    .default("crm-diagnostics"),
  /**
   * Mappa prodotti CRM per ambiente UAT (JSON serializzato da Key Vault).
   * Formato: Record<ProductIdSelfcare, string> dove il valore è il GUID Dynamics.
   * @example '{"prod-pn":"617cbe1b-...","prod-io":"26a975ef-..."}'
   */
  CRM_PRODUCTS_MAP_UAT: z
    .string()
    .min(1, 'CRM_PRODUCTS_MAP_UAT è obbligatoria')
    .transform((val) => {
      try {
        return JSON.parse(val) as Record<string, string>
      } catch {
        throw new Error('CRM_PRODUCTS_MAP_UAT: JSON non valido')
      }
    }),
  /**
   * Mappa prodotti CRM per ambiente PROD (JSON serializzato da Key Vault).
   * Formato: Record<ProductIdSelfcare, string> dove il valore è il GUID Dynamics.
   */
  CRM_PRODUCTS_MAP_PROD: z
    .string()
    .min(1, 'CRM_PRODUCTS_MAP_PROD è obbligatoria')
    .transform((val) => {
      try {
        return JSON.parse(val) as Record<string, string>
      } catch {
        throw new Error('CRM_PRODUCTS_MAP_PROD: JSON non valido')
      }
    }),
  /**
   * Mappa tipologie referente CRM per ambiente UAT (JSON serializzato da Key Vault).
   * Formato: Record<TipologiaReferente, number>.
   */
  CRM_TIPOLOGIA_REFERENTE_MAP_UAT: z
    .string()
    .min(1, 'CRM_TIPOLOGIA_REFERENTE_MAP_UAT è obbligatoria')
    .transform((val) => {
      try {
        return JSON.parse(val) as Record<string, number>
      } catch {
        throw new Error('CRM_TIPOLOGIA_REFERENTE_MAP_UAT: JSON non valido')
      }
    }),
  /**
   * Mappa tipologie referente CRM per ambiente PROD (JSON serializzato da Key Vault).
   * Formato: Record<TipologiaReferente, number>.
   */
  CRM_TIPOLOGIA_REFERENTE_MAP_PROD: z
    .string()
    .min(1, 'CRM_TIPOLOGIA_REFERENTE_MAP_PROD è obbligatoria')
    .transform((val) => {
      try {
        return JSON.parse(val) as Record<string, number>
      } catch {
        throw new Error('CRM_TIPOLOGIA_REFERENTE_MAP_PROD: JSON non valido')
      }
    }),
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
    DIAGNOSTIC_LOGGING_ENABLED: process.env.DIAGNOSTIC_LOGGING_ENABLED,
    DIAGNOSTIC_STORAGE_CONNECTION_STRING:
      process.env.DIAGNOSTIC_STORAGE_CONNECTION_STRING,
    DIAGNOSTIC_STORAGE_CONTAINER: process.env.DIAGNOSTIC_STORAGE_CONTAINER,
    CRM_PRODUCTS_MAP_UAT: process.env.CRM_PRODUCTS_MAP_UAT,
    CRM_PRODUCTS_MAP_PROD: process.env.CRM_PRODUCTS_MAP_PROD,
    CRM_TIPOLOGIA_REFERENTE_MAP_UAT: process.env.CRM_TIPOLOGIA_REFERENTE_MAP_UAT,
    CRM_TIPOLOGIA_REFERENTE_MAP_PROD: process.env.CRM_TIPOLOGIA_REFERENTE_MAP_PROD,
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

// -----------------------------------------------------------------------------
// Singleton config (letto una sola volta all'avvio della Function)
// -----------------------------------------------------------------------------

let _cachedConfig: AppConfig | undefined

/**
 * Restituisce la configurazione dell'app leggendola una sola volta da process.env.
 * Le invocazioni successive restituiscono la stessa istanza (singleton).
 * Usare questa funzione al posto di getConfigOrThrow() nei moduli che vengono
 * importati ad ogni richiesta, per evitare parsing ripetuto.
 *
 * @returns AppConfig validata e cachata
 */
export function getConfig(): AppConfig {
  if (!_cachedConfig) {
    _cachedConfig = getConfigOrThrow()
  }
  return _cachedConfig
}
