import { mapDssResponse } from "../signature/dss";
import type { DssValidationReport } from "../signature/models/signature";

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
});
