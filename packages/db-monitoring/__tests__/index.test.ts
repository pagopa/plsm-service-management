import * as api from "../src/index";

describe("superficie pubblica del package", () => {
  it("esporta quello che i consumatori devono usare", () => {
    expect(Object.keys(api).sort()).toEqual([
      "PRODUCT_IDS",
      "buildCallsSummary",
      "buildListCalls",
      "buildUpsertCall",
      "calls",
      "getCallsSummary",
      "getMonitoringDb",
      "listCalls",
      "resolveCallsSummaryRange",
      "upsertCall",
    ]);
  });
});
