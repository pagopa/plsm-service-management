import { createMeetingOrchestrator } from "../_shared/services/orchestrator";
import { verifyAccount } from "../_shared/services/accounts";
import { verifyOrCreateContact } from "../_shared/services/contacts";
import { createAppointment } from "../_shared/services/appointments";
import { upsertCall } from "@repo/db-monitoring";

jest.mock("../_shared/services/accounts", () => ({
  verifyAccount: jest.fn(),
}));
jest.mock("../_shared/services/contacts", () => ({
  verifyOrCreateContact: jest.fn(),
}));
jest.mock("../_shared/services/appointments", () => ({
  createAppointment: jest.fn(),
}));
jest.mock("@repo/db-monitoring", () => ({
  upsertCall: jest.fn(),
}));

const mockedVerifyAccount = verifyAccount as jest.MockedFunction<typeof verifyAccount>;
const mockedVerifyOrCreateContact = verifyOrCreateContact as jest.MockedFunction<
  typeof verifyOrCreateContact
>;
const mockedCreateAppointment = createAppointment as jest.MockedFunction<
  typeof createAppointment
>;
const mockedUpsertCall = upsertCall as jest.MockedFunction<typeof upsertCall>;

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    baseUrl: "https://org.crm4.dynamics.com",
    institutionIdSelfcare: "22222222-2222-2222-2222-222222222222",
    productIdSelfcare: "prod-pn",
    partecipanti: [{ email: "mario.rossi@example.com" }],
    subject: "Incontro tecnico",
    scheduledstart: "2026-01-15T10:00:00Z",
    scheduledend: "2026-01-15T11:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedVerifyAccount.mockResolvedValue({
    found: true,
    account: { accountid: "acc-1", name: "Comune di Roma" },
    method: "selfcareId",
  } as never);
  mockedVerifyOrCreateContact.mockResolvedValue({
    found: true,
    created: false,
    contact: { contactid: "contact-1" },
  } as never);
  mockedCreateAppointment.mockResolvedValue({
    activityid: "11111111-1111-1111-1111-111111111111",
  } as never);
});

describe("createMeetingOrchestrator — persistenza automatica su db-monitoring", () => {
  it("registra la call con i campi mappati dalla richiesta, dopo la creazione dell'appuntamento", async () => {
    mockedUpsertCall.mockResolvedValue("call-id-1");

    const result = await createMeetingOrchestrator(baseRequest() as never);

    expect(result.success).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(mockedUpsertCall).toHaveBeenCalledWith({
      crmActivityId: "11111111-1111-1111-1111-111111111111",
      productId: "prod-pn",
      callDate: new Date("2026-01-15T10:00:00Z"),
      institutionId: "22222222-2222-2222-2222-222222222222",
      institutionName: "Comune di Roma",
      title: "Incontro tecnico",
    });
    expect(result.steps).toContainEqual(
      expect.objectContaining({ step: "persistCall", success: true }),
    );
  });

  it("non blocca la risposta se la scrittura sul DB monitoring fallisce, ma aggiunge un warning", async () => {
    mockedUpsertCall.mockRejectedValue(new Error("connection refused"));

    const result = await createMeetingOrchestrator(baseRequest() as never);

    expect(result.success).toBe(true);
    expect(result.activityId).toBe("11111111-1111-1111-1111-111111111111");
    expect(result.warnings).toEqual([
      expect.stringContaining("non registrato sul DB monitoring"),
    ]);
    expect(result.steps).toContainEqual(
      expect.objectContaining({ step: "persistCall", success: false }),
    );
  });

  it("non scrive sul DB monitoring in dry-run", async () => {
    const result = await createMeetingOrchestrator(
      baseRequest({ dryRun: true }) as never,
    );

    expect(mockedUpsertCall).not.toHaveBeenCalled();
    expect(result.steps).toContainEqual(
      expect.objectContaining({ step: "persistCall", success: true, skipped: true }),
    );
  });
});
