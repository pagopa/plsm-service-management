import { validateFile, fileToBase64 } from "../signature/validation";

function makeFile(name: string, sizeBytes: number, type = ""): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
}

describe("validateFile", () => {
  const max = 1024;

  it("accepts a .pdf within size limit", () => {
    const res = validateFile(makeFile("doc.pdf", 100, "application/pdf"), max);
    expect(res).toEqual({ ok: true, fileType: "pdf" });
  });

  it("accepts a .p7m within size limit", () => {
    const res = validateFile(makeFile("doc.pdf.p7m", 100), max);
    expect(res).toEqual({ ok: true, fileType: "p7m" });
  });

  it("rejects a missing/empty file", () => {
    const res = validateFile(makeFile("doc.pdf", 0, "application/pdf"), max);
    expect(res).toEqual({
      ok: false,
      status: 400,
      error: "Missing or empty file",
    });
  });

  it("rejects an oversized file", () => {
    const res = validateFile(makeFile("doc.pdf", 2000, "application/pdf"), max);
    expect(res).toEqual({ ok: false, status: 400, error: "File too large" });
  });

  it("rejects an unsupported extension", () => {
    const res = validateFile(makeFile("doc.txt", 100, "text/plain"), max);
    expect(res).toEqual({
      ok: false,
      status: 415,
      error: "Unsupported file type",
    });
  });

  it("rejects a .pdf file with an unexpected MIME type", () => {
    const res = validateFile(makeFile("doc.pdf", 100, "text/plain"), max);
    expect(res).toEqual({
      ok: false,
      status: 415,
      error: "Unsupported file type",
    });
  });

  it("rejects a .p7m file with an unexpected MIME type", () => {
    const res = validateFile(makeFile("doc.p7m", 100, "text/plain"), max);
    expect(res).toEqual({
      ok: false,
      status: 415,
      error: "Unsupported file type",
    });
  });
});

describe("fileToBase64", () => {
  it("encodes file bytes to base64", async () => {
    const file = new File([new Uint8Array([104, 105])], "hi.pdf"); // "hi"
    expect(await fileToBase64(file)).toBe("aGk=");
  });
});
