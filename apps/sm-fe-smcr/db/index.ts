import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { serverEnv } from "@/config/env";
import { relations } from "./relations";

function createDb() {
  const connectionString = serverEnv.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to access the database");
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (error) => {
    process.stderr.write(`Database pool error: ${error.message}\n`);
  });

  return drizzle({ client: pool, relations });
}

type Database = ReturnType<typeof createDb>;

const globalForDb = globalThis as typeof globalThis & {
  smcrDatabase?: Database;
};
let database: Database | undefined;

export function getDb() {
  database ??= globalForDb.smcrDatabase ?? createDb();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.smcrDatabase = database;
  }

  return database;
}
