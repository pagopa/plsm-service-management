import { serverEnv } from "@/config/env";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { jsonResponse, handleExternalApiError } from "@/lib/be/http";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTENSIONS = ["pdf", "p7m"];

function hasAllowedExtension(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return !!ext && ALLOWED_EXTENSIONS.includes(ext);
}

export async function POST(request: Request) {
  if (!serverEnv.SIGNATURE_FN_URL || !serverEnv.SIGNATURE_FN_KEY) {
    logServerError(
      new Error("SIGNATURE_FN_URL/SIGNATURE_FN_KEY non configurate"),
      "validate-signature - missing configuration",
    );
    return jsonResponse({ error: "Servizio non configurato" }, 500);
  }

  let incomingForm: FormData;
  try {
    incomingForm = await request.formData();
  } catch {
    return jsonResponse({ error: "Richiesta non valida" }, 400);
  }

  const file = incomingForm.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonResponse({ error: "File mancante o vuoto" }, 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonResponse(
      { error: "Il file supera la dimensione massima consentita (20MB)" },
      400,
    );
  }

  if (!hasAllowedExtension(file.name)) {
    return jsonResponse({ error: "Formato file non supportato" }, 415);
  }

  const apiUrl = `${serverEnv.SIGNATURE_FN_URL}/api/v1/validate-signature`;

  try {
    const forwardForm = new FormData();
    forwardForm.append("file", file, file.name);

    const apiRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "x-functions-key": serverEnv.SIGNATURE_FN_KEY,
      },
      body: forwardForm,
    });

    if (!apiRes.ok) {
      return await handleExternalApiError(apiRes);
    }
    const data = await apiRes.json();
    return NextResponse.json(data, {
      status: apiRes.status,
    });
  } catch (err) {
    logServerError(err, "validate-signature - errore proxy");
    return jsonResponse({ error: "Errore interno nel proxy" }, 500);
  }
}
