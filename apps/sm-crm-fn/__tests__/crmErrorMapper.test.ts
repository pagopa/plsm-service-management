import { mapCrmError } from "../_shared/services/crmErrorMapper";
import { CrmError } from "../_shared/errors/CrmError";

describe("mapCrmError", () => {
  it("classifies verifyAccount failures as ACCOUNT_NOT_FOUND", () => {
    expect(mapCrmError({ step: "verifyAccount" })).toEqual({
      code: "ACCOUNT_NOT_FOUND",
      category: "NOT_FOUND",
      step: "verifyAccount",
    });
  });

  it("classifies verifyOrCreateContacts failures as CONTACT_INVALID", () => {
    expect(mapCrmError({ step: "verifyOrCreateContacts" })).toEqual({
      code: "CONTACT_INVALID",
      category: "NOT_FOUND",
      step: "verifyOrCreateContacts",
    });
  });

  it("classifies a Dynamics field-rejection OData code as CRM_FIELD_REJECTED", () => {
    const error = new CrmError({
      status: 400,
      odataCode: "0x80040265",
      rawDetail: "The entity field xyz is invalid",
      step: "createAppointment",
    });
    expect(mapCrmError({ step: "createAppointment", error })).toEqual({
      code: "CRM_FIELD_REJECTED",
      category: "CRM_REJECTED",
      step: "createAppointment",
    });
  });

  it("classifies Dynamics 5xx as CRM_UNAVAILABLE", () => {
    const error = new CrmError({ status: 503, step: "createAppointment" });
    expect(mapCrmError({ step: "createAppointment", error })).toEqual({
      code: "CRM_UNAVAILABLE",
      category: "CRM_UNAVAILABLE",
      step: "createAppointment",
    });
  });

  it("falls back to CRM_ERROR for an unclassified createAppointment failure", () => {
    const error = new CrmError({ status: 400, step: "createAppointment" });
    expect(mapCrmError({ step: "createAppointment", error })).toEqual({
      code: "CRM_ERROR",
      category: "UNKNOWN",
      step: "createAppointment",
    });
  });

  it("falls back to UNKNOWN for an unrecognised step without error", () => {
    expect(mapCrmError({ step: "somethingElse" })).toEqual({
      code: "UNKNOWN",
      category: "UNKNOWN",
      step: "somethingElse",
    });
  });

  it("never leaks rawDetail into the mapped output", () => {
    const error = new CrmError({
      status: 400,
      odataCode: "0x80040265",
      rawDetail: "SECRET schema attribute pgp_internal",
      step: "createAppointment",
    });
    const result = mapCrmError({ step: "createAppointment", error });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(JSON.stringify(result)).not.toContain("rawDetail");
  });
});
