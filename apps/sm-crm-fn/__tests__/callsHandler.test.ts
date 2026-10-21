import {
  createCallHandler,
  listCallsHandler,
  callsSummaryHandler,
} from "../calls/handler";
import {
  upsertCall,
  listCalls,
  countCalls,
  getCallsSummary,
  type Call,
} from "@repo/db-monitoring";

jest.mock("@repo/db-monitoring", () => {
  const actual = jest.requireActual("@repo/db-monitoring");
  return {
    ...actual,
    upsertCall: jest.fn(),
    listCalls: jest.fn(),
    countCalls: jest.fn(),
    getCallsSummary: jest.fn(),
  };
});

const mockedUpsertCall = upsertCall as jest.MockedFunction<typeof upsertCall>;
const mockedListCalls = listCalls as jest.MockedFunction<typeof listCalls>;
const mockedCountCalls = countCalls as jest.MockedFunction<typeof countCalls>;
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
    environment: "PROD",
    ...overrides,
  };
}

/** Header della richiesta: `environment` valorizza x-dynamics-environment. */
function makeHeaders(environment?: string) {
  return new Headers(
    environment === undefined ? {} : { "x-dynamics-environment": environment },
  );
}

/** Richiesta GET con i parametri in query string. */
function makeRequest(params: Record<string, string> = {}, environment?: string) {
  const query = new URLSearchParams(params);
  return {
    query: { get: (key: string) => query.get(key) },
    headers: makeHeaders(environment),
  };
}

/** Richiesta POST con il body JSON. */
function makePostRequest(body: unknown, environment?: string) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: makeHeaders(environment),
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

    const request = makePostRequest(validBody);
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
        environment: "PROD",
      }),
    );
  });

  it("registra la call come UAT se l'header x-dynamics-environment è UAT", async () => {
    mockedUpsertCall.mockResolvedValue("33333333-3333-3333-3333-333333333333");

    const response = await createCallHandler(
      makePostRequest(validBody, "uat") as never,
      makeContext() as never,
    );

    expect(response.status).toBe(201);
    expect(mockedUpsertCall).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "UAT" }),
    );
  });

  it("risponde 400 se l'header x-dynamics-environment non è valido", async () => {
    const response = await createCallHandler(
      makePostRequest(validBody, "DEV") as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(response.jsonBody).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        fields: [expect.objectContaining({ field: "x-dynamics-environment" })],
      },
    });
    expect(mockedUpsertCall).not.toHaveBeenCalled();
  });

  it("risponde 400 se productId non è tra i valori ammessi", async () => {
    const request = makePostRequest({
      ...validBody,
      productId: "prod-inesistente",
    });

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
    const request = makePostRequest(bodyWithoutId);

    const response = await createCallHandler(
      request as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedUpsertCall).not.toHaveBeenCalled();
  });

  it("risponde 500 senza dettaglio grezzo se la scrittura fallisce", async () => {
    mockedUpsertCall.mockRejectedValue(new Error("connection refused"));
    const request = makePostRequest(validBody);

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
  beforeEach(() => {
    mockedCountCalls.mockResolvedValue(0);
  });

  it("restituisce la prima pagina, dalla più recente, quando nessun parametro è valorizzato", async () => {
    const calls = [makeCall()];
    mockedListCalls.mockResolvedValue(calls);
    mockedCountCalls.mockResolvedValue(1);

    const response = await listCallsHandler(
      makeRequest() as never,
      makeContext() as never,
    );

    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject({
      success: true,
      count: 1,
      pagination: { page: 1, size: 50, order: "desc", total: 1, totalPages: 1 },
    });
    expect(mockedListCalls).toHaveBeenCalledWith({
      environment: "PROD",
      limit: 50,
      offset: 0,
      order: "desc",
      productId: undefined,
      institutionId: undefined,
      callDateFrom: undefined,
      callDateTo: undefined,
    });
  });

  it("calcola l'offset dalla pagina: page=3 e size=20 partono dalla 41ª call", async () => {
    mockedListCalls.mockResolvedValue([]);
    mockedCountCalls.mockResolvedValue(45);

    const response = await listCallsHandler(
      makeRequest({ page: "3", size: "20" }) as never,
      makeContext() as never,
    );

    expect(mockedListCalls).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 40 }),
    );
    expect(response.jsonBody).toMatchObject({
      pagination: { page: 3, size: 20, total: 45, totalPages: 3 },
    });
  });

  it("passa l'ordinamento ascendente se richiesto", async () => {
    mockedListCalls.mockResolvedValue([]);

    const response = await listCallsHandler(
      makeRequest({ order: "asc" }) as never,
      makeContext() as never,
    );

    expect(mockedListCalls).toHaveBeenCalledWith(
      expect.objectContaining({ order: "asc" }),
    );
    expect(response.jsonBody).toMatchObject({ pagination: { order: "asc" } });
  });

  it("conta il totale con gli stessi filtri della pagina, senza paginazione", async () => {
    mockedListCalls.mockResolvedValue([]);

    await listCallsHandler(
      makeRequest({
        productId: "prod-io",
        dateFrom: "2026-01-01T00:00:00Z",
        page: "2",
      }) as never,
      makeContext() as never,
    );

    expect(mockedCountCalls).toHaveBeenCalledWith({
      environment: "PROD",
      productId: "prod-io",
      institutionId: undefined,
      callDateFrom: new Date("2026-01-01T00:00:00Z"),
      callDateTo: undefined,
    });
  });

  it("restituisce una pagina vuota, non un errore, oltre l'ultima pagina", async () => {
    mockedListCalls.mockResolvedValue([]);
    mockedCountCalls.mockResolvedValue(5);

    const response = await listCallsHandler(
      makeRequest({ page: "10", size: "20" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(200);
    expect(response.jsonBody).toMatchObject({
      count: 0,
      pagination: { page: 10, total: 5, totalPages: 1 },
    });
  });

  it("accetta ancora limit come sinonimo di size", async () => {
    mockedListCalls.mockResolvedValue([]);

    await listCallsHandler(
      makeRequest({ limit: "30" }) as never,
      makeContext() as never,
    );

    expect(mockedListCalls).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 30, offset: 0 }),
    );
  });

  it("usa size se arrivano sia size sia limit", async () => {
    mockedListCalls.mockResolvedValue([]);

    await listCallsHandler(
      makeRequest({ size: "10", limit: "30" }) as never,
      makeContext() as never,
    );

    expect(mockedListCalls).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 }),
    );
  });

  it.each([
    ["page", "0"],
    ["page", "-1"],
    ["page", "1.5"],
    ["size", "0"],
    ["size", "201"],
    ["limit", "201"],
    ["order", "random"],
  ])("risponde 400 se %s=%s non è valido", async (param, value) => {
    const response = await listCallsHandler(
      makeRequest({ [param]: value }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(response.jsonBody).toMatchObject({
      error: { fields: [expect.objectContaining({ field: param })] },
    });
    expect(mockedListCalls).not.toHaveBeenCalled();
    expect(mockedCountCalls).not.toHaveBeenCalled();
  });

  it("legge solo le call UAT se l'header x-dynamics-environment è UAT", async () => {
    mockedListCalls.mockResolvedValue([]);

    await listCallsHandler(
      makeRequest({}, "UAT") as never,
      makeContext() as never,
    );

    expect(mockedListCalls).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "UAT" }),
    );
  });

  it("risponde 400 se l'header x-dynamics-environment non è valido", async () => {
    const response = await listCallsHandler(
      makeRequest({}, "DEV") as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedListCalls).not.toHaveBeenCalled();
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
      environment: "PROD",
      limit: 50,
      offset: 0,
      order: "desc",
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

  it.each([
    [
      "la lettura della pagina",
      () => mockedListCalls.mockRejectedValue(new Error("connection refused")),
    ],
    [
      "il conteggio",
      () => {
        mockedListCalls.mockResolvedValue([]);
        mockedCountCalls.mockRejectedValue(new Error("connection refused"));
      },
    ],
  ])(
    "risponde 500 senza dettaglio grezzo se fallisce %s",
    async (_label, arrange) => {
      arrange();

      const response = await listCallsHandler(
        makeRequest() as never,
        makeContext() as never,
      );

      expect(response.status).toBe(500);
      expect(JSON.stringify(response.jsonBody)).not.toContain(
        "connection refused",
      );
    },
  );
});

describe("callsSummaryHandler", () => {
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
        environment: "PROD",
        year: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      }),
    );
  });

  it("calcola la sintesi sulle sole call UAT se l'header x-dynamics-environment è UAT", async () => {
    mockedGetCallsSummary.mockResolvedValue({ totalCalls: 0, roster: [] });

    await callsSummaryHandler(
      makeRequest({ year: "2026" }, "UAT") as never,
      makeContext() as never,
    );

    expect(mockedGetCallsSummary).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "UAT", year: 2026 }),
    );
  });

  it("risponde 400 se l'header x-dynamics-environment non è valido", async () => {
    const response = await callsSummaryHandler(
      makeRequest({}, "DEV") as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
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

  it("passa dateFrom/dateTo in formato italiano, dateTo esteso a fine giornata", async () => {
    mockedGetCallsSummary.mockResolvedValue({ totalCalls: 0, roster: [] });

    await callsSummaryHandler(
      makeRequest({ dateFrom: "01/03/2026", dateTo: "31/03/2026" }) as never,
      makeContext() as never,
    );

    expect(mockedGetCallsSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: new Date("2026-03-01T00:00:00.000Z"),
        dateTo: new Date("2026-03-31T23:59:59.999Z"),
      }),
    );
  });

  it("accetta anche solo dateFrom senza dateTo", async () => {
    mockedGetCallsSummary.mockResolvedValue({ totalCalls: 0, roster: [] });

    const response = await callsSummaryHandler(
      makeRequest({ dateFrom: "01/03/2026" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(200);
    expect(mockedGetCallsSummary).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: new Date("2026-03-01T00:00:00.000Z") }),
    );
  });

  it("interpreta 01/03/2026 come 1 marzo, non alla americana come 3 gennaio", async () => {
    mockedGetCallsSummary.mockResolvedValue({ totalCalls: 0, roster: [] });

    await callsSummaryHandler(
      makeRequest({ dateFrom: "01/03/2026" }) as never,
      makeContext() as never,
    );

    const calledWith = mockedGetCallsSummary.mock.calls[0]?.[0];
    expect(calledWith?.dateFrom?.getUTCMonth()).toBe(2); // marzo (0-indexed)
    expect(calledWith?.dateFrom?.getUTCDate()).toBe(1);
  });

  it("risponde 400 se dateFrom non è in formato GG/MM/AAAA", async () => {
    const response = await callsSummaryHandler(
      makeRequest({ dateFrom: "2026-03-01" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
  });

  it("risponde 400 se la data GG/MM/AAAA non esiste nel calendario", async () => {
    const response = await callsSummaryHandler(
      makeRequest({ dateFrom: "31/02/2026" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
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
      makeRequest({ year: "2026", dateFrom: "01/03/2026" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(mockedGetCallsSummary).not.toHaveBeenCalled();
  });

  it("risponde 400 se dateFrom è successivo a dateTo", async () => {
    const response = await callsSummaryHandler(
      makeRequest({ dateFrom: "31/03/2026", dateTo: "01/03/2026" }) as never,
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
