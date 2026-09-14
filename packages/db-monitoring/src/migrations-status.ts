/** Migrazioni presenti nel repository ma non ancora registrate sul database. */
export function selectPending(available: string[], applied: string[]): string[] {
  const done = new Set(applied);
  return available.filter((name) => !done.has(name));
}

/** Migrazioni registrate sul database la cui cartella non esiste più nel repository. */
export function findOrphans(available: string[], applied: string[]): string[] {
  const known = new Set(available);
  return applied.filter((name) => !known.has(name));
}

export interface PendingMigration {
  name: string;
  sql: string;
}

export interface SummaryInput {
  environment: string;
  sslmode: string;
  pending: PendingMigration[];
  orphans: string[];
}

/** Rende lo stato delle migrazioni in Markdown adatto a $GITHUB_STEP_SUMMARY. */
export function formatSummary(input: SummaryInput): string {
  const lines: string[] = [
    "## Migrazioni del database `monitoring`",
    "",
    `- Ambiente: \`${input.environment}\``,
    `- Connessione: \`sslmode=${input.sslmode}\``,
    "",
  ];

  if (input.pending.length === 0) {
    lines.push("✅ Nessuna migrazione pendente: il database è allineato al repository.");
  } else {
    lines.push(`### ${input.pending.length} migrazione/i da applicare`, "");
    for (const migration of input.pending) {
      lines.push(
        "<details>",
        `<summary><code>${migration.name}</code></summary>`,
        "",
        "```sql",
        migration.sql.trim(),
        "```",
        "",
        "</details>",
        "",
      );
    }
  }

  if (input.orphans.length > 0) {
    lines.push(
      "",
      "### ⚠️ Migrazioni applicate ma non più presenti nel repository",
      "",
      ...input.orphans.map((name) => `- \`${name}\``),
      "",
      "Questo non blocca l'esecuzione, ma segnala che database e codice sono divergenti.",
    );
  }

  return lines.join("\n");
}
