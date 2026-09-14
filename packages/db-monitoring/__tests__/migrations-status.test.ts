import { findOrphans, formatSummary, selectPending } from "../src/migrations-status";

describe("selectPending", () => {
  it("restituisce le migrazioni non ancora applicate mantenendo l'ordine", () => {
    const available = ["20260101000000_a", "20260202000000_b", "20260303000000_c"];

    expect(selectPending(available, ["20260101000000_a"])).toEqual([
      "20260202000000_b",
      "20260303000000_c",
    ]);
  });

  it("restituisce lista vuota quando il database è allineato", () => {
    const available = ["20260101000000_a"];

    expect(selectPending(available, ["20260101000000_a"])).toEqual([]);
  });

  it("considera tutte pendenti quando il database è vergine", () => {
    const available = ["20260101000000_a", "20260202000000_b"];

    expect(selectPending(available, [])).toEqual(available);
  });
});

describe("findOrphans", () => {
  it("segnala le migrazioni applicate che non esistono più nel repository", () => {
    expect(findOrphans(["20260202000000_b"], ["20260101000000_a", "20260202000000_b"])).toEqual([
      "20260101000000_a",
    ]);
  });

  it("non segnala nulla quando ogni migrazione applicata esiste ancora", () => {
    expect(findOrphans(["20260101000000_a"], ["20260101000000_a"])).toEqual([]);
  });
});

describe("formatSummary", () => {
  const base = { environment: "app-prod", sslmode: "require", orphans: [] as string[] };

  it("dichiara l'allineamento quando non ci sono migrazioni pendenti", () => {
    const summary = formatSummary({ ...base, pending: [] });

    expect(summary).toContain("Nessuna migrazione pendente");
    expect(summary).toContain("app-prod");
    expect(summary).toContain("sslmode=require");
    expect(summary).not.toContain("<details>");
  });

  it("elenca ogni migrazione pendente con il proprio SQL collassato", () => {
    const summary = formatSummary({
      ...base,
      pending: [{ name: "20260909130825_create_calls", sql: "CREATE TABLE calls ();\n" }],
    });

    expect(summary).toContain("1 migrazione/i da applicare");
    expect(summary).toContain("<summary><code>20260909130825_create_calls</code></summary>");
    expect(summary).toContain("CREATE TABLE calls ();");
  });

  it("avvisa delle migrazioni orfane senza presentarle come errore bloccante", () => {
    const summary = formatSummary({ ...base, pending: [], orphans: ["20250101000000_vecchia"] });

    expect(summary).toContain("20250101000000_vecchia");
    expect(summary).toContain("non blocca");
  });

  it("rende visibile una connessione non cifrata", () => {
    const summary = formatSummary({ ...base, sslmode: "disable", pending: [] });

    expect(summary).toContain("sslmode=disable");
  });
});
