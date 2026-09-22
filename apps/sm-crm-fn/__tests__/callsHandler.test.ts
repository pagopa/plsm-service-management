import {
  createCallHandler,
  listCallsHandler,
  callsSummaryHandler,
} from "../calls/handler";
import {
  upsertCall,
  listCalls,
  getCallsSummary,
  type Call,
} from "@repo/db-monitoring";

jest.mock("@repo/db-monitoring", () => {
  const actual = jest.requireActual("@repo/db-monitoring");
  return {
    ...actual,
    upsertCall: jest.fn(),
    listCalls: jest.fn(),
    getCallsSummary: jest.fn(),
  };
});

const mockedUpsertCall = upsertCall as jest.MockedFunction<typeof upsertCall>;
const mockedListCalls = listCalls as jest.MockedFunction<typeof listCalls>;
const mockedGetCallsSummary = getCallsSummary as jest.MockedFunction<
  typeof getCallsSummary
>;

function makeContext() {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function makeCall(overrides: Partial<Call> = {}): Call {
  return {
    id: "33333333-3333-3333-3333-333333333333",
    crmActivityId: "11111111-1111-1111-1111-111111111111",
    title: "Incontro tecnico",
    institutionId: "22222222-2222-2222-2222-222222222222",
    institutionName: "Comune di Roma",
    productId: "prod-pn",
    callDate: new Date("2026-01-15T10:00:00Z"),
    link: "https://meet.example.com/abc",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    updatedAt: new Date("2026-01-15T10:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createCallHandler", () => {
  const validBody = {
    crmActivityId: "11111111-1111-1111-1111-111111111111",
    title: "Incontro tecnico",
    institutionId: "22222222-2222-2222-2222-222222222222",
    institutionName: "Comune di Roma",
    productId: "prod-pn",
    callDate: "2026-01-15T10:00:00Z",
    link: "https://meet.example.com/abc",
  };

  it("registra la call e restituisce 201 con l'id", async () => {
    mockedUpsertCall.mockResolvedValue("33333333-3333-3333-3333-333333333333");

    const request = { json: jest.fn().mockResolvedValue(validBody) };
    const response = await createCallHandler(
      request as never,
      makeContext() as never,
    );

    expect(response.status).toBe(201);
    expect(response.jsonBody).toMatchObject({
      success: true,
      data: { id: "33333333-3333-3333-3333-333333333333" },
    });
    expect(mockedUpsertCall).toHaveBeenCalledWith(
      expect.objectContaining({
        crmActivityId: validBody.crmActivityId,
        productId: "prod-pn",
        callDate: new Date(validBody.callDate),
      }),
    );
  });

  it("risponde 400 se productId non è tra i valori ammessi", async () => {
    const request = {
      json: jest
        .fn()
        .mockResolvedValue({ ...validBody, productId: "prod-inesistente" }),
    };

    const response = await createCallHandler(
      request as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(response.jsonBody).toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(mockedUpsertCall).not.toHaveBeenCalled();
  });

  it("risponde 400 se crmActivityId manca", async () => {
    const { crmActivityId, ...bodyWithoutId } = validBody;
    const request = { json: jest.fn().mockResolvedValue(bodyWithoutId) };

    const response = await createCallHandler(
      request as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedUpsertCall).not.toHaveBeenCalled();
  });

  it("risponde 500 senza dettaglio grezzo se la scrittura fallisce", async () => {
    mockedUpsertCall.mockRejectedValue(new Error("connection refused"));
    const request = { json: jest.fn().mockResolvedValue(validBody) };

    const response = await createCallHandler(
      request as never,
      makeContext() as never,
    );

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.jsonBody)).not.toContain(
      "connection refused",
    );
  });
});

describe("listCallsHandler", () => {
  function makeRequest(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params);
    return { query: { get: (key: string) => query.get(key) } };
  }

  it("restituisce tutte le call quando nessun filtro è valorizzato", async () => {
    const calls = [makeCall()];
    mockedListCalls.mockResolvedValue(calls);

    const response = await listCallsHandler(
      makeRequest() as never,
      makeContext() as never,
    );

    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject({ success: true, count: 1 });
    expect(mockedListCalls).toHaveBeenCalledWith({
      limit: 50,
      productId: undefined,
      institutionId: undefined,
      callDateFrom: undefined,
      callDateTo: undefined,
    });
  });

  it("applica il filtro prodotto", async () => {
    mockedListCalls.mockResolvedValue([]);

    await listCallsHandler(
      makeRequest({ productId: "prod-io" }) as never,
      makeContext() as never,
    );

    expect(mockedListCalls).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "prod-io" }),
    );
  });

  it("passa il range temporale a listCalls, delegando il filtro al database", async () => {
    const inRange = makeCall({ id: "1", callDate: new Date("2026-01-15T10:00:00Z") });
    mockedListCalls.mockResolvedValue([inRange]);

    const response = await listCallsHandler(
      makeRequest({
        productId: "prod-io",
        dateFrom: "2026-01-01T00:00:00Z",
        dateTo: "2026-01-31T23:59:59Z",
      }) as never,
      makeContext() as never,
    );

    expect(mockedListCalls).toHaveBeenCalledWith({
      limit: 50,
      productId: "prod-io",
      institutionId: undefined,
      callDateFrom: new Date("2026-01-01T00:00:00Z"),
      callDateTo: new Date("2026-01-31T23:59:59Z"),
    });
    expect(response.jsonBody).toMatchObject({ count: 1 });
    expect((response.jsonBody as { data: Call[] }).data).toEqual([inRange]);
  });

  it("risponde 400 se dateFrom è successivo a dateTo", async () => {
    const response = await listCallsHandler(
      makeRequest({
        dateFrom: "2026-02-01T00:00:00Z",
        dateTo: "2026-01-01T00:00:00Z",
      }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedListCalls).not.toHaveBeenCalled();
  });

  it("risponde 400 se productId non è tra i valori ammessi", async () => {
    const response = await listCallsHandler(
      makeRequest({ productId: "prod-inesistente" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedListCalls).not.toHaveBeenCalled();
  });

  it("risponde 500 senza dettaglio grezzo se la lettura fallisce", async () => {
    mockedListCalls.mockRejectedValue(new Error("connection refused"));

    const response = await listCallsHandler(
      makeRequest() as never,
      makeContext() as never,
    );

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.jsonBody)).not.toContain(
      "connection refused",
    );
  });
});

describe("callsSummaryHandler", () => {
  function makeRequest(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params);
    return { query: { get: (key: string) => query.get(key) } };
  }

  it("restituisce la sintesi delegando l'anno di default al layer db", async () => {
    mockedGetCallsSummary.mockResolvedValue({
      totalCalls: 42,
      roster: [{ productId: "prod-io", calls: 30, position: 1 }],
    });

    const response = await callsSummaryHandler(
      makeRequest() as never,
      makeContext() as never,
    );

    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject({
      success: true,
      data: {
        totalCalls: 42,
        roster: [{ productId: "prod-io", calls: 30, position: 1 }],
      },
    });
    expect(mockedGetCallsSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        year: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      }),
    );
  });

  it("passa l'anno richiesto come numero", async () => {
    mockedGetCallsSummary.mockResolvedValue({ totalCalls: 0, roster: [] });

    await callsSummaryHandler(
      makeRequest({ year: "2025" }) as never,
      makeContext() as never,
    );

    expect(mockedGetCallsSummary).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2025 }),
    );
  });

  it("passa dateFrom/dateTo come Date quando presenti", async () => {
    mockedGetCallsSummary.mockResolvedValue({ totalCalls: 0, roster: [] });

    await callsSummaryHandler(
      makeRequest({
        dateFrom: "2026-03-01T00:00:00Z",
        dateTo: "2026-03-31T23:59:59Z",
      }) as never,
      makeContext() as never,
    );

    expect(mockedGetCallsSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: new Date("2026-03-01T00:00:00Z"),
        dateTo: new Date("2026-03-31T23:59:59Z"),
      }),
    );
  });

  it("accetta anche solo dateFrom senza dateTo", async () => {
    mockedGetCallsSummary.mockResolvedValue({ totalCalls: 0, roster: [] });

    const response = await callsSummaryHandler(
      makeRequest({ dateFrom: "2026-03-01T00:00:00Z" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(200);
    expect(mockedGetCallsSummary).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: new Date("2026-03-01T00:00:00Z") }),
    );
  });

  it("risponde 400 se year non è un intero valido", async () => {
    const response = await callsSummaryHandler(
      makeRequest({ year: "abc" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
  });

  it("risponde 400 se year è fuori range", async () => {
    const response = await callsSummaryHandler(
      makeRequest({ year: "1999" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
  });

  it("risponde 400 se vengono passati sia year sia dateFrom/dateTo", async () => {
    const response = await callsSummaryHandler(
      makeRequest({ year: "2026", dateFrom: "2026-03-01T00:00:00Z" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
  });

  it("risponde 400 se dateFrom è successivo a dateTo", async () => {
    const response = await callsSummaryHandler(
      makeRequest({
        dateFrom: "2026-03-31T00:00:00Z",
        dateTo: "2026-03-01T00:00:00Z",
      }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
  });

  it("risponde 500 senza dettaglio grezzo se la lettura fallisce", async () => {
    mockedGetCallsSummary.mockRejectedValue(new Error("connection refused"));

    const response = await callsSummaryHandler(
      makeRequest() as never,
      makeContext() as never,
    );

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.jsonBody)).not.toContain(
      "connection refused",
    );
  });
});
