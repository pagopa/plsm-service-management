import { drizzle } from "drizzle-orm/node-postgres";
import { buildUpsertCall, buildListCalls } from "../src/queries/calls";

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
