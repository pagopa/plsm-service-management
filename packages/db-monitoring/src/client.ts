import { drizzle } from "drizzle-orm/node-postgres";

export type MonitoringDb = ReturnType<typeof createDb>;

function createDb() {
  const connectionString = process.env.MONITORING_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "MONITORING_DATABASE_URL is required to access the monitoring database",
    );
  }

  return drizzle(connectionString);
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
