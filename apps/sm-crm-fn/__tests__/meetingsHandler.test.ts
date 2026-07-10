import { createMeetingHandler } from "../meetings/handler";
import {
  createMeetingOrchestrator,
  validateOrchestratorRequest,
} from "../_shared/services/orchestrator";

jest.mock("../_shared/services/orchestrator", () => ({
  createMeetingOrchestrator: jest.fn(),
  validateOrchestratorRequest: jest.fn(),
}));

const mockedCreateMeetingOrchestrator =
  createMeetingOrchestrator as jest.MockedFunction<typeof createMeetingOrchestrator>;
const mockedValidateOrchestratorRequest =
  validateOrchestratorRequest as jest.MockedFunction<typeof validateOrchestratorRequest>;

function makeRequest(body: unknown) {
  return {
    headers: { get: jest.fn().mockReturnValue(null) },
    json: jest.fn().mockResolvedValue(body),
  };
}

function makeContext() {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

describe("createMeetingHandler", () => {
  beforeEach(() => {
    process.env.DYNAMICS_BASE_URL = "https://org.crm4.dynamics.com";
    jest.clearAllMocks();
  });

  it("emits a neutral error object for validation failures", async () => {
    mockedValidateOrchestratorRequest.mockReturnValue({
      valid: false,
      errors: ["subject is required"],
    } as ReturnType<typeof validateOrchestratorRequest>);

    const response = await createMeetingHandler(
      makeRequest({}) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(400);
    expect(response.jsonBody).toMatchObject({
      success: false,
      message: "Errore di validazione",
      errors: ["subject is required"],
      error: {
        code: "VALIDATION_ERROR",
        category: "VALIDATION",
        step: "validation",
      },
    });
  });

  it("mirrors orchestrator errorInfo as top-level error for failed orchestration", async () => {
    const errorInfo = {
      code: "ACCOUNT_NOT_FOUND",
      category: "NOT_FOUND",
      step: "verifyAccount",
    } as const;
    mockedValidateOrchestratorRequest.mockReturnValue({
      valid: true,
      data: { dryRun: false },
    } as ReturnType<typeof validateOrchestratorRequest>);
    mockedCreateMeetingOrchestrator.mockResolvedValue({
      success: false,
      dryRun: false,
      steps: [],
      warnings: [],
      errorInfo,
      timestamp: "2026-07-10T08:00:00.000Z",
    });

    const response = await createMeetingHandler(
      makeRequest({ subject: "Call" }) as never,
      makeContext() as never,
    );

    expect(response.status).toBe(500);
    expect(response.jsonBody).toMatchObject({
      success: false,
      errorInfo,
      error: errorInfo,
      message: "Errore durante la creazione dell'appuntamento",
    });
  });

  it("emits a neutral error object without raw exception text for unexpected failures", async () => {
    const rawErrorMessage = "SECRET Dynamics exception detail";
    const response = await createMeetingHandler(
      {
        headers: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn().mockRejectedValue(new Error(rawErrorMessage)),
      } as never,
      makeContext() as never,
    );

    expect(response.status).toBe(500);
    expect(response.jsonBody).toMatchObject({
      success: false,
      message: "Errore interno del server",
      error: {
        code: "CRM_ERROR",
        category: "UNKNOWN",
        step: "unexpected",
      },
    });
    expect(JSON.stringify(response.jsonBody)).not.toContain(rawErrorMessage);
  });
});
