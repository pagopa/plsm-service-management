export type EnteKind = "UNIVERSITÀ" | "GOV" | "REGIONE";

export function inferEnteKind(description: string): EnteKind {
  const d = description
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  if (/\b(?:universita|politecnico)\b/i.test(d)) return "UNIVERSITÀ";
  if (/\b(?:regione|regionale|regionali)\b/i.test(d)) return "REGIONE";
  return "GOV";
}
