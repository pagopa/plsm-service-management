import { drizzle } from "drizzle-orm/node-postgres";
import {
  buildUpsertCall,
  buildListCalls,
  buildCallsSummary,
  resolveCallsSummaryRange,
  summarizeCallCounts,
} from "../src/queries/calls";

const db = drizzle("postgresql://localhost:5432/monitoring");

const input = {
  crmActivityId: "11111111-1111-1111-1111-111111111111",
  title: "Incontro tecnico",
  institutionId: "22222222-2222-2222-2222-222222222222",
  institutionName: "Comune di Roma",
  productId: "prod-pn" as const,
  callDate: new Date("2026-01-15T10:00:00Z"),
  link: "https://meet.example.com/abc",
};

describe("buildUpsertCall", () => {
  it("usa crm_activity_id come chiave di conflitto", () => {
    const { sql } = buildUpsertCall(db, input).toSQL();

    expect(sql).toContain('on conflict ("crm_activity_id") do update');
  });

  it("aggiorna i campi mutabili e il timestamp di modifica", () => {
    const { sql } = buildUpsertCall(db, input).toSQL();

    expect(sql).toContain('"title" = coalesce(excluded.title,');
    expect(sql).toContain('"product_id" = excluded.product_id');
    expect(sql).toContain('"updated_at" = now()');
  });

  it("non azzera i campi opzionali su un retry con payload parziale", () => {
    const { sql } = buildUpsertCall(db, input).toSQL();

    expect(sql).toContain('"title" = coalesce(excluded.title, "calls"."title")');
    expect(sql).toContain(
      '"institution_id" = coalesce(excluded.institution_id, "calls"."institution_id")',
    );
    expect(sql).toContain(
      '"institution_name" = coalesce(excluded.institution_name, "calls"."institution_name")',
    );
    expect(sql).toContain('"link" = coalesce(excluded.link, "calls"."link")');
  });

  it("non sovrascrive created_at in caso di conflitto", () => {
    const { sql } = buildUpsertCall(db, input).toSQL();

    expect(sql).not.toContain('"created_at" = excluded.created_at');
  });

  it("restituisce l'id della riga", () => {
    const { sql } = buildUpsertCall(db, input).toSQL();

    expect(sql).toContain('returning "id"');
  });

  it("passa i valori come parametri, non interpolati nell'SQL", () => {
    const { params } = buildUpsertCall(db, input).toSQL();

    expect(params).toContain("Incontro tecnico");
    expect(params).toContain("prod-pn");
  });
});

describe("buildListCalls", () => {
  it("ordina per data discendente e applica un limite", () => {
    const { sql } = buildListCalls(db, { limit: 20 }).toSQL();

    expect(sql).toContain('order by "calls"."call_date" desc');
    expect(sql).toContain("limit");
  });

  it("filtra per prodotto quando richiesto", () => {
    const { sql, params } = buildListCalls(db, {
      limit: 20,
      productId: "prod-io",
    }).toSQL();

    expect(sql).toContain('"product_id" = ');
    expect(params).toContain("prod-io");
  });

  it("filtra per range di data quando richiesto", () => {
    const callDateFrom = new Date("2026-01-01T00:00:00Z");
    const callDateTo = new Date("2026-01-31T23:59:59Z");
    const { sql, params } = buildListCalls(db, {
      limit: 20,
      callDateFrom,
      callDateTo,
    }).toSQL();

    expect(sql).toContain('"call_date" >= ');
    expect(sql).toContain('"call_date" <= ');
    expect(params).toContain(callDateFrom.toISOString());
    expect(params).toContain(callDateTo.toISOString());
  });

  it("compone il range di data con gli altri filtri in AND", () => {
    const { sql } = buildListCalls(db, {
      limit: 20,
      productId: "prod-io",
      institutionId: "22222222-2222-2222-2222-222222222222",
      callDateFrom: new Date("2026-01-01T00:00:00Z"),
    }).toSQL();

    const whereClause = sql.slice(sql.indexOf("where"));
    expect(whereClause).toContain("and");
    expect(whereClause).toContain('"product_id" = ');
    expect(whereClause).toContain('"institution_id" = ');
    expect(whereClause).toContain('"call_date" >= ');
  });

  it("non applica alcun filtro sulla data se dateFrom/dateTo sono assenti", () => {
    const { sql } = buildListCalls(db, { limit: 20 }).toSQL();

    expect(sql).not.toContain('"call_date" >=');
    expect(sql).not.toContain('"call_date" <=');
  });
});

describe("buildCallsSummary", () => {
  const range = {
    from: new Date("2026-01-01T00:00:00.000Z"),
    to: new Date("2026-12-31T23:59:59.999Z"),
  };

  it("filtra sul range richiesto, entrambi i limiti inclusi", () => {
    const { sql, params } = buildCallsSummary(db, range).toSQL();

    expect(sql).toContain('"call_date" >= ');
    expect(sql).toContain('"call_date" <= ');
    expect(params).toContain(range.from.toISOString());
    expect(params).toContain(range.to.toISOString());
  });

  it("applica solo il filtro presente se from o to sono assenti", () => {
    const { sql: sqlFromOnly } = buildCallsSummary(db, {
      from: range.from,
    }).toSQL();
    expect(sqlFromOnly).toContain('"call_date" >= ');
    expect(sqlFromOnly).not.toContain('"call_date" <= ');

    const { sql: sqlToOnly } = buildCallsSummary(db, { to: range.to }).toSQL();
    expect(sqlToOnly).not.toContain('"call_date" >= ');
    expect(sqlToOnly).toContain('"call_date" <= ');
  });

  it("non applica alcun filtro se from e to sono entrambi assenti", () => {
    const { sql } = buildCallsSummary(db, {}).toSQL();

    expect(sql).not.toContain("where");
  });

  it("raggruppa per prodotto e ordina per conteggio discendente, a parità per productId", () => {
    const { sql } = buildCallsSummary(db, range).toSQL();

    expect(sql).toContain('group by "calls"."product_id"');
    expect(sql).toContain("order by count(*) desc");
    expect(sql).toContain('"calls"."product_id" asc');
  });

  it("restituisce productId e conteggio per riga", () => {
    const { sql } = buildCallsSummary(db, range).toSQL();

    expect(sql).toContain('select "product_id", count(*)');
  });
});

describe("resolveCallsSummaryRange", () => {
  it("converte year nell'intero anno solare, entrambi i limiti inclusi", () => {
    const range = resolveCallsSummaryRange({ year: 2026 });

    expect(range.from).toEqual(new Date("2026-01-01T00:00:00.000Z"));
    expect(range.to).toEqual(new Date("2026-12-31T23:59:59.999Z"));
  });

  it("usa l'anno corrente UTC se non è specificato nulla", () => {
    const range = resolveCallsSummaryRange({});
    const currentYear = new Date().getUTCFullYear();

    expect(range.from).toEqual(new Date(Date.UTC(currentYear, 0, 1)));
  });

  it("dateFrom/dateTo hanno precedenza su year se specificati insieme", () => {
    const dateFrom = new Date("2026-03-01T00:00:00.000Z");
    const dateTo = new Date("2026-03-31T23:59:59.999Z");

    const range = resolveCallsSummaryRange({ year: 2020, dateFrom, dateTo });

    expect(range).toEqual({ from: dateFrom, to: dateTo });
  });

  it("accetta anche solo uno tra dateFrom e dateTo, ignorando year", () => {
    const dateFrom = new Date("2026-03-01T00:00:00.000Z");

    const range = resolveCallsSummaryRange({ year: 2020, dateFrom });

    expect(range).toEqual({ from: dateFrom, to: undefined });
  });
});

describe("summarizeCallCounts", () => {
  it("somma tutti i prodotti nel totale, non solo quelli in classifica", () => {
    const rows = [
      { productId: "prod-io" as const, calls: 20 },
      { productId: "prod-pagopa" as const, calls: 15 },
      { productId: "prod-interop" as const, calls: 10 },
      { productId: "prod-pn" as const, calls: 10 },
      { productId: "prod-rtp" as const, calls: 5 },
    ];

    const summary = summarizeCallCounts(rows);

    expect(summary.totalCalls).toBe(60);
  });

  it("limita il roster ai primi 3, assegnando la posizione nell'ordine ricevuto (a parità già risolta a monte)", () => {
    const rows = [
      { productId: "prod-io" as const, calls: 20 },
      { productId: "prod-pagopa" as const, calls: 15 },
      { productId: "prod-interop" as const, calls: 10 },
      { productId: "prod-pn" as const, calls: 10 },
    ];

    const summary = summarizeCallCounts(rows);

    expect(summary.roster).toEqual([
      { productId: "prod-io", calls: 20, position: 1 },
      { productId: "prod-pagopa", calls: 15, position: 2 },
      { productId: "prod-interop", calls: 10, position: 3 },
    ]);
  });

  it("gestisce meno di 3 prodotti senza errori", () => {
    const rows = [{ productId: "prod-io" as const, calls: 5 }];

    const summary = summarizeCallCounts(rows);

    expect(summary).toEqual({
      totalCalls: 5,
      roster: [{ productId: "prod-io", calls: 5, position: 1 }],
    });
  });

  it("gestisce un array vuoto", () => {
    expect(summarizeCallCounts([])).toEqual({ totalCalls: 0, roster: [] });
  });
});
