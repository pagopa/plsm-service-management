import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { permissions } from "../db/schema";

const catalog = [
  {
    code: "overview.read",
    name: "Accesso a Overview",
    description: "Consente di visualizzare la pagina Overview.",
  },
  {
    code: "overview.write",
    name: "Modifica dati ente in Overview",
    description: "Consente di modificare i dati dell'ente in Overview.",
  },
  {
    code: "pnpg.read",
    name: "Accesso a PNPG",
    description: "Consente di accedere alle funzionalità PNPG.",
  },
  {
    code: "firma.io.read",
    name: "Accesso a Firma con IO",
    description: "Consente di accedere alla firma con IO.",
  },
  {
    code: "firma.ente.read",
    name: "Accesso a Firme per ente",
    description: "Consente di visualizzare e gestire le firme per ente.",
  },
  {
    code: "firma.verifica.read",
    name: "Accesso a Verifica firma",
    description: "Consente di verificare le firme.",
  },
  {
    code: "wallet.read",
    name: "Accesso a E-Service Wallet",
    description: "Consente di accedere a E-Service Wallet.",
  },
  {
    code: "wallet.templates.read",
    name: "Accesso ai template e-service",
    description: "Consente di accedere ai template e-service.",
  },
  {
    code: "utenze.io.read",
    name: "Accesso a Verifica utenze IO",
    description: "Consente di accedere alla verifica utenze IO.",
  },
  {
    code: "certificati.read",
    name: "Accesso a Certificati",
    description: "Consente di accedere alla gestione certificati.",
  },
  {
    code: "onboarding.read",
    name: "Accesso a Onboarding",
    description: "Consente di accedere alle funzionalità di onboarding.",
  },
  {
    code: "pda.read",
    name: "Accesso a PDA",
    description: "Consente di accedere alle funzionalità PDA.",
  },
  {
    code: "call.management.read",
    name: "Accesso a Call Management",
    description:
      "Consente l'accesso a Call Management e al monitoraggio delle chiamate.",
  },
  {
    code: "portale.fatturazione.read",
    name: "Accesso al Portale Fatturazione",
    description: "Consente di accedere al Portale Fatturazione.",
  },
  {
    code: "teams.manage",
    name: "Gestione team",
    description: "Consente di gestire i team.",
  },
  {
    code: "members.manage",
    name: "Gestione membri",
    description: "Consente di visualizzare e gestire i membri.",
  },
  {
    code: "permissions.manage",
    name: "Gestione permessi",
    description: "Consente di gestire i permessi.",
  },
  {
    code: "logs.read",
    name: "Accesso ai log",
    description: "Consente di visualizzare i log applicativi.",
  },
] satisfies (typeof permissions.$inferInsert)[];

async function main() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- Il seed è eseguito direttamente da Yarn, fuori da Turbo.
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL non è impostata.");
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  try {
    const db = drizzle({ client: pool });
    const inserted = await db
      .insert(permissions)
      .values(catalog)
      .onConflictDoNothing({ target: permissions.code })
      .returning({ code: permissions.code });

    process.stdout.write(
      `Permessi inseriti: ${inserted.length}/${catalog.length}\n`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Seed dei permessi fallito: ${message}\n`);
  process.exitCode = 1;
});
