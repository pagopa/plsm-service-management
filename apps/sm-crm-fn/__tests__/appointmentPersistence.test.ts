import { analyzeAppointmentPersistence } from "../_shared/services/appointments";

describe("analyzeAppointmentPersistence", () => {
  it("returns no issues when all verified fields are persisted", () => {
    const sent = {
      subject: "Call",
      category: "Next step X",
      pgp_oggettodelcontatto: 100000000,
      sortdate: "2026-07-20T00:00:00Z",
    };
    const persisted = {
      activityid: "id-1",
      subject: "Call",
      category: "Next step X",
      pgp_oggettodelcontatto: 100000000,
      sortdate: "2026-07-20T00:00:00Z",
    };

    expect(analyzeAppointmentPersistence(sent, persisted)).toEqual([]);
  });

  it("flags a field as missing when Dynamics returns null (es. field-level security)", () => {
    const sent = { category: "Next step X", pgp_oggettodelcontatto: 100000000 };
    const persisted = {
      activityid: "id-1",
      category: null,
      pgp_oggettodelcontatto: 100000000,
    };

    const issues = analyzeAppointmentPersistence(sent, persisted);

    expect(issues).toEqual([
      {
        field: "category",
        sentValue: "Next step X",
        persistedValue: null,
        reason: "missing",
      },
    ]);
  });

  it("flags a field as overwritten when the persisted value differs", () => {
    const sent = { pgp_oggettodelcontatto: 100000000 };
    const persisted = {
      activityid: "id-1",
      pgp_oggettodelcontatto: 100000005,
    };

    const issues = analyzeAppointmentPersistence(sent, persisted);

    expect(issues).toEqual([
      {
        field: "pgp_oggettodelcontatto",
        sentValue: 100000000,
        persistedValue: 100000005,
        reason: "overwritten",
      },
    ]);
  });

  it("treats equivalent number and date formats as persisted", () => {
    const sent = {
      pgp_oggettodelcontatto: 100000000,
      sortdate: "2026-07-20T00:00:00Z",
    };
    const persisted = {
      activityid: "id-1",
      pgp_oggettodelcontatto: "100000000",
      sortdate: "2026-07-20T00:00:00+00:00",
    };

    expect(analyzeAppointmentPersistence(sent, persisted)).toEqual([]);
  });

  it("ignores fields not present in the sent payload", () => {
    const sent = { subject: "Call" };
    const persisted = { activityid: "id-1", subject: "Call", category: null };

    expect(analyzeAppointmentPersistence(sent, persisted)).toEqual([]);
  });

  it("returns no issues when the representation is missing", () => {
    const sent = { category: "Next step X" };

    expect(analyzeAppointmentPersistence(sent, null)).toEqual([]);
  });
});
