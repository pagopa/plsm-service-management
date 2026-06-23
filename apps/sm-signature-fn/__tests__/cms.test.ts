import { extractCmsSignedContent } from "../signature/cms";

describe("extractCmsSignedContent", () => {
  it("returns null for non-ASN.1 content", () => {
    const pdfBytes = Buffer.from("%PDF-1.7\n", "utf8");

    expect(extractCmsSignedContent(pdfBytes)).toBeNull();
  });

  it("extracts the signed content from the outer p7m fixture", () => {
    const fixture = Buffer.from(
      "302c06092a864886f70d010702a01f301d0201013100301406092a864886f70d010701a007040568656c6c6f3100",
      "hex",
    );

    const extracted = extractCmsSignedContent(fixture);

    expect(extracted).not.toBeNull();
    expect(Buffer.from(extracted ?? [])).toEqual(Buffer.from("hello", "utf8"));
  });

  it("extracts constructed signed content split into OCTET STRING chunks", () => {
    const fixture = Buffer.from(
      "303006092a864886f70d010702a02330210201013100301806092a864886f70d010701a00b24090402686504036c6c6f3100",
      "hex",
    );

    const extracted = extractCmsSignedContent(fixture);

    expect(extracted).not.toBeNull();
    expect(Buffer.from(extracted ?? [])).toEqual(Buffer.from("hello", "utf8"));
  });
});
