import { mapDssResponse, callDssApi, DssApiError } from "../signature/dss";
import type { DssValidationReport } from "../signature/models/signature";
import type { AppConfig } from "../utils/checkConfig";

const report: DssValidationReport = {
  simpleReport: {
    signatureOrTimestamp: [
      {
        signedBy: "Mario Rossi",
        indication: "TOTAL_PASSED",
        signatureLevel: "PAdES-BASELINE-LT",
        signingTime: "2026-01-01T10:00:00Z",
        certificateChain: {
          certificate: [
            { qualifiedName: "Mario Rossi", countryName: "IT" },
            { qualifiedName: "Aruba PEC QTSP", countryName: "IT" },
          ],
        },
      },
      {
        signedBy: "Anna Bianchi",
        indication: "INDETERMINATE",
        signatureLevel: "CAdES-BASELINE-B",
        signingTime: "2026-02-02T12:00:00Z",
        warnings: ["The certificate chain is not trusted"],
      },
    ],
  },
};

describe("mapDssResponse", () => {
  it("maps a multi-signature report into the public contract", () => {
    const result = mapDssResponse(report, "doc.pdf", "pdf");
    expect(result.fileName).toBe("doc.pdf");
    expect(result.fileType).toBe("pdf");
    expect(result.totalSignatures).toBe(2);
    expect(result.validSignatures).toBe(1);
    expect(result.signatures[0]).toEqual({
      signerName: "Mario Rossi",
      qtsp: "Aruba PEC QTSP",
      country: "IT",
      indication: "TOTAL_PASSED",
      signatureLevel: "PAdES-BASELINE-LT",
      signingTime: "2026-01-01T10:00:00Z",
      issues: [],
    });
    expect(result.signatures[1].indication).toBe("INDETERMINATE");
    expect(result.signatures[1].issues).toEqual([
      "The certificate chain is not trusted",
    ]);
  });

  it("returns an empty result when there are no signatures", () => {
    const result = mapDssResponse({}, "empty.p7m", "p7m");
    expect(result.totalSignatures).toBe(0);
    expect(result.validSignatures).toBe(0);
    expect(result.signatures).toEqual([]);
  });

  it("falls back to safe defaults for unknown indication", () => {
    const result = mapDssResponse(
      { simpleReport: { signatureOrTimestamp: [{ signedBy: "X" }] } },
      "x.pdf",
      "pdf",
    );
    expect(result.signatures[0].indication).toBe("INDETERMINATE");
    expect(result.signatures[0].signerName).toBe("X");
    expect(result.signatures[0].qtsp).toBe("");
  });

  it("tolerates a non-array signatureOrTimestamp", () => {
    const result = mapDssResponse(
      { simpleReport: { signatureOrTimestamp: {} as never } },
      "x.pdf",
      "pdf",
    );
    expect(result.totalSignatures).toBe(0);
    expect(result.signatures).toEqual([]);
  });

  it("skips null entries in the signature array", () => {
    const result = mapDssResponse(
      {
        simpleReport: {
          signatureOrTimestamp: [null as never, { signedBy: "Y" }],
        },
      },
      "x.pdf",
      "pdf",
    );
    expect(result.totalSignatures).toBe(1);
    expect(result.signatures[0].signerName).toBe("Y");
  });

  it("maps a PascalCase DSS report (unconfirmed real casing)", () => {
    const pascalReport: DssValidationReport = {
      SimpleReport: {
        Signatures: [
          {
            SignedBy: "Mario Rossi",
            Indication: "TOTAL_PASSED",
            SignatureLevel: "PAdES-BASELINE-LT",
            SigningTime: "2026-01-01T10:00:00Z",
            CertificateChain: {
              Certificate: [
                { QualifiedName: "Mario Rossi", CountryName: "IT" },
                { QualifiedName: "Aruba PEC QTSP", CountryName: "IT" },
              ],
            },
            Warnings: ["minor warning"],
          },
        ],
      },
    };
    const result = mapDssResponse(pascalReport, "doc.pdf", "pdf");
    expect(result.totalSignatures).toBe(1);
    expect(result.validSignatures).toBe(1);
    expect(result.signatures[0]).toEqual({
      signerName: "Mario Rossi",
      qtsp: "Aruba PEC QTSP",
      country: "IT",
      indication: "TOTAL_PASSED",
      signatureLevel: "PAdES-BASELINE-LT",
      signingTime: "2026-01-01T10:00:00Z",
      issues: ["minor warning"],
    });
  });
});

describe("callDssApi", () => {
  const config: AppConfig = {
    dssApiBaseUrl: "http://dss.example:8080",
    maxFileSizeBytes: 1024,
  };
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the parsed report on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ simpleReport: { signatureOrTimestamp: [] } }),
    }) as unknown as typeof fetch;
    const report = await callDssApi(config, "aGk=", "doc.pdf");
    expect(report.simpleReport?.signatureOrTimestamp).toEqual([]);
  });

  it("maps a 500 'not recognized' body to a 422 DssApiError", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Document format not recognized/handled",
    }) as unknown as typeof fetch;
    await expect(callDssApi(config, "aGk=", "doc.pdf")).rejects.toMatchObject({
      status: 422,
    });
  });

  it("maps a generic 500 body to a 502 DssApiError", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "NullPointerException at com.example",
    }) as unknown as typeof fetch;
    await expect(callDssApi(config, "aGk=", "doc.pdf")).rejects.toMatchObject({
      status: 502,
    });
  });

  it("maps a network failure to a 502 DssApiError", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    await expect(callDssApi(config, "aGk=", "doc.pdf")).rejects.toBeInstanceOf(
      DssApiError,
    );
  });
});
