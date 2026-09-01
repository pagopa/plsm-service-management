import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./relations";

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to access the database");
  }

  return drizzle(connectionString, { relations });
}

let database: ReturnType<typeof createDb> | undefined;

export function getDb() {
  database ??= createDb();

  return database;
}
