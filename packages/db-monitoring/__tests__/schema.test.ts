import { getTableName, getTableColumns } from "drizzle-orm";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { calls, PRODUCT_IDS } from "../src/schema";

describe("calls schema", () => {
  it("mappa sulla tabella calls", () => {
    expect(getTableName(calls)).toBe("calls");
  });

  it("espone esattamente le colonne previste con i nomi snake_case", () => {
    const columns = getTableColumns(calls);
    const names = Object.values(columns).map((c) => c.name).sort();

    expect(names).toEqual([
      "call_date",
      "created_at",
      "crm_activity_id",
      "id",
      "institution_id",
      "institution_name",
      "link",
      "product_id",
      "title",
      "updated_at",
    ]);
  });

  it("rende obbligatorie solo le colonne richieste dal task", () => {
    const columns = getTableColumns(calls);
    const required = Object.values(columns)
      .filter((c) => c.notNull && !c.hasDefault)
      .map((c) => c.name)
      .sort();

    expect(required).toEqual(["call_date", "product_id"]);
  });

  it("elenca i prodotti supportati", () => {
    expect(PRODUCT_IDS).toEqual([
      "prod-io",
      "prod-interop",
      "prod-pn",
      "prod-pagopa",
      "prod-io-sign",
    ]);
  });

  it("vincola product_id esattamente ai valori di PRODUCT_IDS", () => {
    const constraint = getTableConfig(calls).checks.find(
      (c) => c.name === "calls_product_id_check",
    );

    expect(constraint).toBeDefined();

    const { params } = new PgDialect().sqlToQuery(constraint!.value);

    expect(params).toEqual([...PRODUCT_IDS]);
  });
});
