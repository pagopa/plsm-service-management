export type FileType = "pdf" | "p7m";

export type ValidateOk = { ok: true; fileType: FileType };
export type ValidateErr = { ok: false; status: 400 | 415; error: string };
export type ValidateResult = ValidateOk | ValidateErr;

function detectFileType(name: string): FileType | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".p7m")) return "p7m";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

export function validateFile(file: File, maxBytes: number): ValidateResult {
  if (!file || file.size === 0) {
    return { ok: false, status: 400, error: "Missing or empty file" };
  }
  if (file.size > maxBytes) {
    return { ok: false, status: 400, error: "File too large" };
  }
  const fileType = detectFileType(file.name);
  if (!fileType) {
    return { ok: false, status: 415, error: "Unsupported file type" };
  }
  return { ok: true, fileType };
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}
