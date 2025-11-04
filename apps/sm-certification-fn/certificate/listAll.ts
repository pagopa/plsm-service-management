// File: src/functions/listAll.ts
import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getConnectedClient } from "./db/database";
import { getConfigOrThrow } from "../utils/checkConfig";

/**
 * Endpoint HTTP GET che restituisce tutte le righe della tabella certificates.
 * Protezione tramite API key letta dagli header (API_KEY / api_key / x-api-key).
 */
export async function listAll(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("listAll endpoint triggered.");

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

  const headerApiKey =
    request.headers.get("API_KEY") ??
    request.headers.get("api_key") ??
    request.headers.get("x-api-key");

  if (!headerApiKey || headerApiKey !== config.apiKey) {
    context.warn("API key non valida o assente.");
    return {
      status: 401,
      jsonBody: { error: "Unauthorized" },
    };
  }

  const client = await getConnectedClient(config);
  try {
    const query = `
      SELECT
        idp,
        "use",
        expiration_date,
        days_remaining,
        certificate
      FROM ${config.dbtable}
      ORDER BY expiration_date ASC, idp ASC
    `;
    const result = await client.query(query);

    return {
      status: 200,
      jsonBody: result.rows,
    };
  } catch (err) {
    context.error("Errore durante la lettura dal DB.", err);
    return {
      status: 500,
      jsonBody: { error: "Errore nel recupero dei dati dal database." },
    };
  } finally {
    try {
      await client.end();
      context.log("Connessione DB chiusa.");
    } catch (error) {
      console.error(`Operazione connessione DB fallita: ${error}`);
    }
  }
}
