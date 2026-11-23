import "dotenv/config";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { Client } from "pg";

// La prima migrazione è una baseline generata introspezionando un DB esistente:
// il suo SQL è interamente commentato e drizzle-kit, spezzandolo sui
// `--> statement-breakpoint`, la fa fallire ("unterminated /* comment").
// Su un DB che ha già lo schema va solo registrata come applicata.
// Lo script è idempotente e va lanciato prima di `db:migrate`.

const BASELINE_NAME = "20260804123426_whole_shadowcat";
const MIGRATIONS_FOLDER = "./db/migrations";
// Tabelle create dalla baseline che nessuna migrazione successiva elimina:
// se ci sono tutte lo schema della baseline è presente, se ne manca solo
// qualcuna il DB è in uno stato parziale e ci si ferma.
const BASELINE_TABLES = ["ama_access", "logs", "members"];

// Stessa DDL che usa drizzle-orm (pg-core migrate) per un DB nuovo.
const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint,
    name text,
    applied_at timestamp with time zone DEFAULT now()
  )`;

function log(message: string) {
  process.stdout.write(`[db:baseline] ${message}\n`);
}

async function main() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- Lo script è eseguito direttamente da Yarn, fuori da Turbo.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL non è impostata.");
  }

  const baseline = readMigrationFiles({
    migrationsFolder: MIGRATIONS_FOLDER,
  }).find((migration) => migration.name === BASELINE_NAME);
  if (!baseline) {
    throw new Error(`Baseline ${BASELINE_NAME} non trovata in ${MIGRATIONS_FOLDER}.`);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const schema = await client.query<{ table: string; exists: boolean }>(
      `select t as table, to_regclass('public.' || t) is not null as exists
       from unnest($1::text[]) as t`,
      [BASELINE_TABLES],
    );
    const missing = schema.rows.filter((row) => !row.exists).map((row) => row.table);
    if (missing.length === BASELINE_TABLES.length) {
      log("schema applicativo assente: niente da registrare.");
      return;
    }
    if (missing.length > 0) {
      throw new Error(
        `Schema parziale (mancano ${missing.join(", ")}): non registro la baseline, serve un controllo manuale.`,
      );
    }

    const table = await client.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'drizzle' and table_name = '__drizzle_migrations'`,
    );
    const columns = new Set(table.rows.map((row) => row.column_name));
    if (columns.size > 0 && !columns.has("name")) {
      log("tabella delle migrazioni nel formato precedente: la aggiorna drizzle-kit, non la tocco.");
      return;
    }

    await client.query("begin");
    await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await client.query(CREATE_MIGRATIONS_TABLE);

    const existing = await client.query(
      "select 1 from drizzle.__drizzle_migrations where name = $1",
      [baseline.name],
    );
    if (existing.rowCount) {
      await client.query("rollback");
      log(`baseline ${baseline.name} già registrata.`);
      return;
    }

    await client.query(
      'insert into drizzle.__drizzle_migrations ("hash", "created_at", "name") values ($1, $2, $3)',
      [baseline.hash, baseline.folderMillis, baseline.name],
    );
    await client.query("commit");
    log(`baseline ${baseline.name} registrata come applicata.`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Registrazione della baseline fallita: ${message}\n`);
  process.exitCode = 1;
});
