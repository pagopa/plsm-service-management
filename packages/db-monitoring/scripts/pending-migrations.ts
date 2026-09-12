import "dotenv/config";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { findOrphans, formatSummary, selectPending } from "../src/migrations-status";

const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

/** 3F000 = schema inesistente, 42P01 = tabella inesistente: entrambi significano "primo lancio". */
const NEVER_MIGRATED = new Set(["3F000", "42P01"]);

function availableMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function appliedMigrations(pool: Pool): Promise<string[]> {
  try {
    const { rows } = await pool.query<{ name: string }>(
      "select name from drizzle.__drizzle_migrations order by name",
    );
    return rows.map((row) => row.name);
  } catch (error) {
    if (NEVER_MIGRATED.has((error as { code?: string }).code ?? "")) {
      return [];
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const connectionString = process.env.MONITORING_DATABASE_URL;
  if (!connectionString) {
    throw new Error("MONITORING_DATABASE_URL non è impostata.");
  }

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });

  try {
    const available = availableMigrations();
    const applied = await appliedMigrations(pool);
    const pending = selectPending(available, applied).map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"),
    }));

    process.stdout.write(
      `${formatSummary({
        environment: process.env.TARGET_ENVIRONMENT ?? "non dichiarato",
        sslmode: new URL(connectionString).searchParams.get("sslmode") ?? "non specificato",
        pending,
        orphans: findOrphans(available, applied),
      })}\n`,
    );

    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `pending_count=${pending.length}\n`);
    }

    if (process.argv.includes("--fail-on-pending") && pending.length > 0) {
      throw new Error(
        `${pending.length} migrazione/i risultano ancora pendenti: il database non è allineato.`,
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`Impossibile leggere lo stato delle migrazioni: ${(error as Error).message}`);
  process.exit(1);
});
