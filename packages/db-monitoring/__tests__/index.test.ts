import * as api from "../src/index";

describe("superficie pubblica del package", () => {
  it("esporta quello che i consumatori devono usare", () => {
    expect(Object.keys(api).sort()).toEqual([
      "ENVIRONMENTS",
      "LIST_CALLS_ORDERS",
      "PRODUCT_IDS",
      "buildCallsSummary",
      "buildCountCalls",
      "buildListCalls",
      "buildUpsertCall",
      "calls",
      "countCalls",
      "getCallsSummary",
      "getMonitoringDb",
      "listCalls",
      "resolveCallsSummaryRange",
      "summarizeCallCounts",
      "upsertCall",
    ]);
  });
});
