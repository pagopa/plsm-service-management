import { validateNestedP7m } from "../signature/nestedP7m";
import type { DssValidationReport } from "../signature/models/signature";
import type { AppConfig } from "../utils/checkConfig";

const cmsFixture = Buffer.from(
  "302c06092a864886f70d010702a01f301d0201013100301406092a864886f70d010701a007040568656c6c6f3100",
  "hex",
);
const config: AppConfig = {
  dssApiBaseUrl: "http://dss.example",
  maxFileSizeBytes: 10 * 1024 * 1024,
};

function reportFor(name: string): DssValidationReport {
  return {
    SimpleReport: {
      signatureOrTimestampOrEvidenceRecord: [
        {
          Signature: {
            SignedBy: name,
            Indication: "TOTAL_PASSED",
            SignatureFormat: "CAdES-BASELINE-B",
            BestSignatureTime: "2026-06-23T08:53:51Z",
          },
        },
      ],
    },
  };
}

describe("validateNestedP7m", () => {
  it("validates nested p7m levels and aggregates signatures outer-to-inner without validating the final PDF payload", async () => {
    const callDssApi = jest
      .fn()
      .mockResolvedValueOnce(reportFor("LORENZO FREDIANELLI"))
      .mockResolvedValueOnce(reportFor("VIONI RICCARDO"))
      .mockResolvedValueOnce(reportFor("Stefania Zammarchi"));
    const extractCmsSignedContent = jest
      .fn()
      .mockReturnValueOnce(cmsFixture)
      .mockReturnValueOnce(cmsFixture)
      .mockReturnValueOnce(Buffer.from("%PDF-1.7\n"));

    const result = await validateNestedP7m({
      bytes: cmsFixture,
      callDssApi,
      config,
      extractCmsSignedContent,
      fileName: "doc.pdf.p7m.p7m.p7m",
      maxDepth: 5,
    });

    expect(callDssApi).toHaveBeenCalledTimes(3);
    expect(extractCmsSignedContent).toHaveBeenCalledTimes(3);
    expect(result.fileType).toBe("p7m");
    expect(result.totalSignatures).toBe(3);
    expect(result.validSignatures).toBe(3);
    expect(result.signatures.map((signature) => signature.signerName)).toEqual([
      "LORENZO FREDIANELLI",
      "VIONI RICCARDO",
      "Stefania Zammarchi",
    ]);
  });

  it("stops when a nested p7m level has no extractable signed content", async () => {
    const callDssApi = jest
      .fn()
      .mockResolvedValueOnce(reportFor("LORENZO FREDIANELLI"));
    const extractCmsSignedContent = jest.fn().mockReturnValueOnce(null);

    const result = await validateNestedP7m({
      bytes: cmsFixture,
      callDssApi,
      config,
      extractCmsSignedContent,
      fileName: "doc.pdf.p7m",
    });

    expect(callDssApi).toHaveBeenCalledTimes(1);
    expect(result.totalSignatures).toBe(1);
    expect(result.validSignatures).toBe(1);
  });

  it("does not validate extracted ASN.1 content that is not CMS SignedData", async () => {
    const callDssApi = jest
      .fn()
      .mockResolvedValueOnce(reportFor("LORENZO FREDIANELLI"));
    const extractCmsSignedContent = jest
      .fn()
      .mockReturnValueOnce(Buffer.from("3000", "hex"));

    await validateNestedP7m({
      bytes: cmsFixture,
      callDssApi,
      config,
      extractCmsSignedContent,
      fileName: "doc.pdf.p7m",
    });

    expect(callDssApi).toHaveBeenCalledTimes(1);
  });

  it("throws instead of returning a partial result when maxDepth is exhausted", async () => {
    const callDssApi = jest
      .fn()
      .mockResolvedValueOnce(reportFor("LORENZO FREDIANELLI"));
    const extractCmsSignedContent = jest.fn().mockReturnValueOnce(cmsFixture);

    await expect(
      validateNestedP7m({
        bytes: cmsFixture,
        callDssApi,
        config,
        extractCmsSignedContent,
        fileName: "doc.pdf.p7m.p7m",
        maxDepth: 1,
      }),
    ).rejects.toThrow("Nested p7m max depth exceeded");
  });
});
