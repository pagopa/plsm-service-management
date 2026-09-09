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
