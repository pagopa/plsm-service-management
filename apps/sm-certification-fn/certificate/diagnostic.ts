import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getConnectedClient } from "./db/database";
import { getConfigOrThrow } from "../utils/checkConfig";
import { sendDiagnosticEmail } from "../utils/emailNotifier";

export async function diagnostic(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("Diagnostic endpoint triggered.");

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

    const certificates = result.rows.map((row) => ({
      idp: row.idp,
      use: row.use,
      expirationDate: row.expiration_date,
      daysRemaining: row.days_remaining,
      certificate: row.certificate,
    }));

    await sendDiagnosticEmail(config, certificates);

    context.log(
      `Email di diagnostica inviata con ${certificates.length} certificati.`,
    );

    return {
      status: 200,
      jsonBody: { message: "Email di diagnostica inviata con successo." },
    };
  } catch (err) {
    context.error("Errore durante l'invio dell'email di diagnostica.", err);
    return {
      status: 500,
      jsonBody: { error: "Errore nell'invio dell'email di diagnostica." },
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
