export type FileType = "pdf" | "p7m";

export type ValidateOk = { ok: true; fileType: FileType };
export type ValidateErr = { ok: false; status: 400 | 415; error: string };
export type ValidateResult = ValidateOk | ValidateErr;

const ALLOWED_MIME_TYPES: Record<FileType, string[]> = {
  pdf: ["application/pdf"],
  p7m: [
    "",
    "application/pkcs7-mime",
    "application/x-pkcs7-mime",
    "application/octet-stream",
  ],
};

function detectFileType(name: string): FileType | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".p7m")) return "p7m";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

function hasAllowedMimeType(file: File, fileType: FileType): boolean {
  return ALLOWED_MIME_TYPES[fileType].includes(file.type);
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
  if (!hasAllowedMimeType(file, fileType)) {
    return { ok: false, status: 415, error: "Unsupported file type" };
  }
  return { ok: true, fileType };
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}
