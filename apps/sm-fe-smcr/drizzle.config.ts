import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const password = Buffer.from(
  process.env.DB_PASSWORD_B64 ?? "",
  "base64",
).toString("utf-8");
const sslEnabled = process.env.DB_SSL?.toLowerCase() === "true";

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER as string,
    password,
    database: process.env.DB_NAME as string,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  },
});
