import { Client } from "pg";
import { CertificateInfo } from "../models/certificate"; // Assumiamo che CertificateInfo sia il tipo di un singolo certificato

// Assumiamo che il tipo in ingresso sia una Map, come nello script precedente
type CertificatesByExpiration = Map<string, CertificateInfo[]>;

export async function insertCertificatesIntoDb(
  certificatesByExpiration: CertificatesByExpiration,
  client: Client
): Promise<void> {
  // 1. Appiattisci tutti i certificati in un unico array
  const allCerts = Array.from(certificatesByExpiration.values()).flat();

  if (allCerts.length === 0) {
    console.log("Nessun certificato da inserire. Svuotamento della tabella.");
    await client.query("TRUNCATE TABLE certificates");
    return;
  }

  // 2. Prepara dinamicamente i placeholder per l'inserimento bulk
  // Es: VALUES ($1, $2, ...), ($6, $7, ...), ...
  const values = allCerts
    .map((cert, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      })`;
    })
    .join(",");

  // 3. Prepara l'array di valori da passare alla query
  const params = allCerts.flatMap((cert) => [
    cert.idp,
    cert.use,
    cert.expirationDate,
    cert.daysRemaining,
    cert.certificate,
  ]);

  const queryText = `
    INSERT INTO certificates (idp, use, expiration_date, days_remaining, certificate)
    VALUES ${values}
  `;

  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE certificates RESTART IDENTITY");
    await client.query(queryText, params); // 4. Esegui UNA SOLA query di inserimento
    await client.query("COMMIT");
    console.log(
      `${allCerts.length} certificati inseriti nel database con successo.`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Errore durante l'inserimento bulk nel database:", err);
    throw err;
  }
}
