import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getConfigOrThrow } from "../utils/checkConfig";
import { validateFile, fileToBase64 } from "./validation";
import { callDssApi, mapDssResponse, DssApiError } from "./dss";

export async function validateSignature(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("validate-signature endpoint triggered.");

  let config;
  try {
    config = getConfigOrThrow();
  } catch (err) {
    context.error("Config non valida o mancante.", err);
    return {
      status: 500,
      jsonBody: { error: "Configurazione mancante o invalida." },
    };
  }

  let file: File;
  try {
    const formData = await request.formData();
    const entry = formData.get("file");
    if (!(entry instanceof File)) {
      return { status: 400, jsonBody: { error: "Missing file field" } };
    }
    file = entry;
  } catch (err) {
    context.warn("Impossibile leggere il multipart form-data.", err);
    return { status: 400, jsonBody: { error: "Invalid multipart/form-data" } };
  }

  const validation = validateFile(file, config.maxFileSizeBytes);
  if (!validation.ok) {
    return { status: validation.status, jsonBody: { error: validation.error } };
  }

  try {
    const bytesBase64 = await fileToBase64(file);
    const report = await callDssApi(config, bytesBase64, file.name);
    const result = mapDssResponse(report, file.name, validation.fileType);
    return { status: 200, jsonBody: result };
  } catch (err) {
    if (err instanceof DssApiError) {
      const message =
        err.status === 422
          ? "Document format not recognized"
          : "Signature validation service unavailable";
      context.warn(`DSS error (${err.status}): ${err.message}`);
      return { status: err.status, jsonBody: { error: message } };
    }
    context.error("Errore inatteso durante la validazione.", err);
    return { status: 500, jsonBody: { error: "Internal error" } };
  }
}
