import { findOrphans, selectPending } from "../src/migrations-status";

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
