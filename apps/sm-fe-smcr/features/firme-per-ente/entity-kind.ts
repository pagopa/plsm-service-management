export type EnteKind = "UNIVERSITÀ" | "GOV" | "REGIONE";

export function inferEnteKind(description: string): EnteKind {
  const d = description.trim();
  if (/^regione|regionale|regionali\b/i.test(d)) return "REGIONE";
  if (/^università|università|universita|università|politecnico\b/i.test(d))
    return "UNIVERSITÀ";
  return "GOV";
}
