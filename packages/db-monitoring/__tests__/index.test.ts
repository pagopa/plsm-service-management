import * as api from "../src/index";

describe("superficie pubblica del package", () => {
  it("esporta quello che i consumatori devono usare", () => {
    expect(Object.keys(api).sort()).toEqual([
      "PRODUCT_IDS",
      "buildListCalls",
      "buildUpsertCall",
      "calls",
      "getMonitoringDb",
      "listCalls",
      "upsertCall",
    ]);
  });
});
