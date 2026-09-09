import { drizzle } from "drizzle-orm/node-postgres";

export type MonitoringDb = ReturnType<typeof createDb>;

/**
 * Numero massimo di connessioni per processo. Il server consente 50 connessioni
 * in totale e i consumatori sono serverless: con il default di node-postgres (10)
 * bastano cinque istanze calde per saturarlo.
 */
const DEFAULT_POOL_MAX = 5;

function createDb() {
  const connectionString = process.env.MONITORING_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "MONITORING_DATABASE_URL is required to access the monitoring database",
    );
  }

  const configuredMax = Number(process.env.MONITORING_DATABASE_POOL_MAX);
  const max =
    Number.isInteger(configuredMax) && configuredMax > 0
      ? configuredMax
      : DEFAULT_POOL_MAX;

  return drizzle({
    connection: {
      connectionString,
      max,
      // Senza timeout esplicito l'attesa di una connessione è infinita: una
      // Function resterebbe appesa fino al proprio timeout invece di fallire.
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    },
  });
}

let database: MonitoringDb | undefined;

/**
 * Restituisce il client del database monitoring, creandolo alla prima chiamata.
 * L'istanza è riusata per tutta la vita del processo: il server consente
 * al massimo 50 connessioni.
 */
export function getMonitoringDb(): MonitoringDb {
  database ??= createDb();

  return database;
}
