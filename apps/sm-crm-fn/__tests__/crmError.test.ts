import { CrmError } from "../_shared/errors/CrmError";

describe("CrmError", () => {
  it("keeps rawDetail out of the default message", () => {
    const err = new CrmError({
      status: 500,
      odataCode: "0x80040265",
      rawDetail: "SECRET raw OData body with https://internal.crm.example/api",
    });

    expect(err.message).not.toContain("SECRET");
    expect(err.message).not.toContain("https://");
    expect(err.message).not.toContain("0x80040265");
    expect(err.rawDetail).toContain("SECRET");
  });

  it("uses an explicit message only when provided, still never forced to include rawDetail", () => {
    const err = new CrmError({ status: 503 });

    expect(err.message).toBe("CRM request failed (status 503)");
  });
});
