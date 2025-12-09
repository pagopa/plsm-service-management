import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

// Recupero variabili d'ambiente
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
const CONTAINER_NAME = process.env.CONTAINER_NAME || "fatpublic";

export async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`[START] Richiesta ricevuta: ${request.method} ${request.url}`);

  try {
    if (!STORAGE_ACCOUNT_NAME) {
      throw new Error("Manca la variabile d'ambiente STORAGE_ACCOUNT_NAME");
    }

    const fileBuffer = await request.arrayBuffer();
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      context.warn("[WARN] Body vuoto.");
      return { status: 400, body: "Il file PDF è vuoto o mancante." };
    }
    context.log(`[BODY] Ricevuti ${fileBuffer.byteLength} bytes.`);

    const filename =
      request.query.get("filename") || `manuale-${Date.now()}.pdf`;

    context.log("[AUTH] Inizializzazione DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    const blobUrl = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;

    const blobServiceClient = new BlobServiceClient(blobUrl, credential);

    context.log(`[STEP 1/3] Accesso al container '${CONTAINER_NAME}'...`);
    const containerClient =
      blobServiceClient.getContainerClient(CONTAINER_NAME);

    context.log("[STEP 2/3] Verifico esistenza container...");
    await containerClient.createIfNotExists();

    context.log(`[STEP 3/3] Upload del file '${filename}'...`);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    await blockBlobClient.uploadData(Buffer.from(fileBuffer), {
      blobHTTPHeaders: {
        blobContentType: "application/pdf",
      },
    });

    context.log("[SUCCESS] Upload terminato correttamente.");

    return {
      status: 200,
      body: `File ${filename} salvato correttamente in ${CONTAINER_NAME}.`,
    };
  } catch (error: any) {
    context.error("[ERROR] Errore durante l'esecuzione:", error);
    return {
      status: 500,
      body: `Errore interno: ${error.message || error}`,
    };
  }
}
