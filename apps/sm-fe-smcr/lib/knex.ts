// lib/knex.ts
import knex, { Knex } from "knex";

// Per evitare di creare più istanze su ogni import (utile in dev/hot reload o serverless)
declare global {
  var knexInstance: Knex | undefined;
}

const port = parseInt(process.env.DB_PORT ?? "5432", 10);
const sslEnabled = process.env.DB_SSL?.toLowerCase() === "true";

// Decodifica sicura della password (Base64)
const encodedUser = encodeURIComponent(process.env.DB_USER ?? "");
const rawPassword = Buffer.from(
  process.env.DB_PASSWORD_B64 ?? "",
  "base64",
).toString("utf-8");

// Connection string
const connectionString = `postgresql://${encodedUser}:${rawPassword}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}${sslEnabled ? "?sslmode=require" : ""}`;

// Solo in sviluppo, stampa dettagli (evita in prod per sicurezza)
// if (process.env.NODE_ENV !== "production") {
//   console.log("[🔌 DB CONNECTION INFO]");
//   console.log(`→ Host: ${process.env.DB_HOST}`);
//   console.log(`→ SSL: ${sslEnabled ? "ENABLED" : "DISABLED"}`);
//   console.log("-------------------------------------------------");
// }

// Singleton pattern per evitare troppi pool
const knexConfig: Knex.Config = {
  client: "pg",
  connection: {
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 5000,
    acquireTimeoutMillis: 10000,
    createRetryIntervalMillis: 1000,
    afterCreate: (conn: any, done: any) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Nuova connessione al DB stabilita");
      }
      done(null, conn);
    },
    // Optional: utile se vuoi loggare gli errori
    // o se usi strumenti per monitorare il pool
    // validate: (conn) => conn.isValid && typeof conn.isValid === 'function' && conn.isValid(),
  },
};

const db = global.knexInstance ?? knex(knexConfig);

if (process.env.NODE_ENV !== "production") global.knexInstance = db;

export default db;
