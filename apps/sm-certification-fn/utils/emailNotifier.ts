import * as nodemailer from "nodemailer";
import { AppConfig } from "./checkConfig";
import { CertificateInfo } from "../certificate/models/certificate";

const EXPIRY_THRESHOLD_DAYS = 30;

/**
 * Crea un transporter nodemailer a partire dalla configurazione SMTP.
 * Singleton a livello di modulo: viene creato una sola volta al primo utilizzo.
 */
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(config: AppConfig): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
    });
  }
  return _transporter;
}

/**
 * Costruisce il corpo HTML dell'email con una tabella dei certificati in scadenza.
 */
function buildHtmlBody(certificates: CertificateInfo[]): string {
  const rows = certificates
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map(
      (cert) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-size:12px;word-break:break-all;">${cert.idp}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${cert.use}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${cert.expirationDate}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;color:${cert.daysRemaining <= 7 ? "#c0392b" : "#e67e22"};font-weight:bold;">${cert.daysRemaining}</td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;margin:0;padding:24px;">
  <h2 style="color:#c0392b;">⚠️ Certificati SPID in scadenza entro ${EXPIRY_THRESHOLD_DAYS} giorni</h2>
  <p>Sono stati rilevati <strong>${certificates.length}</strong> certificat${certificates.length === 1 ? "o" : "i"} in scadenza entro i prossimi <strong>${EXPIRY_THRESHOLD_DAYS} giorni</strong>.</p>
  <table style="border-collapse:collapse;width:100%;margin-top:16px;">
    <thead>
      <tr style="background-color:#2c3e50;color:#fff;">
        <th style="padding:10px 12px;text-align:left;">Identity Provider (entityID)</th>
        <th style="padding:10px 12px;text-align:center;">Uso</th>
        <th style="padding:10px 12px;text-align:center;">Data scadenza</th>
        <th style="padding:10px 12px;text-align:center;">Giorni rimanenti</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#999;">
    Questo messaggio è generato automaticamente dalla funzione <em>sm-certification-fn</em> — Service Management PagoPA.
  </p>
</body>
</html>`;
}

/**
 * Invia una singola email con la lista dei certificati SPID in scadenza.
 * Se non ci sono certificati in scadenza, non invia nulla.
 *
 * @param config   Configurazione applicazione (SMTP + indirizzi email)
 * @param expiring Lista di certificati con daysRemaining <= EXPIRY_THRESHOLD_DAYS
 */
export async function sendExpiringCertificatesEmail(
  config: AppConfig,
  expiring: CertificateInfo[],
): Promise<void> {
  if (expiring.length === 0) {
    return;
  }

  const transporter = getTransporter(config);

  await transporter.sendMail({
    from: config.fromEmail,
    to: config.alertEmail,
    subject: `[SM Certificati] ${expiring.length} certificat${expiring.length === 1 ? "o" : "i"} SPID in scadenza entro ${EXPIRY_THRESHOLD_DAYS} giorni`,
    html: buildHtmlBody(expiring),
  });
}

/**
 * Costruisce il corpo HTML dell'email di diagnostica con info DB e tabella completa certificati.
 */
function buildDiagnosticHtmlBody(
  config: AppConfig,
  certificates: CertificateInfo[],
): string {
  const dbConnection = `${config.host}:${config.port}/${config.dbname}`;

  const rows = certificates
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map((cert) => {
      let color = "#333";
      if (cert.daysRemaining <= 7) {
        color = "#c0392b";
      } else if (cert.daysRemaining <= 30) {
        color = "#e67e22";
      }
      return `
        <tr>
          <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-size:12px;word-break:break-all;">${cert.idp}</td>
          <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${cert.use}</td>
          <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;">${cert.expirationDate}</td>
          <td style="padding:8px 12px;border:1px solid #ddd;text-align:center;color:${color};font-weight:bold;">${cert.daysRemaining}</td>
        </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;margin:0;padding:24px;">
  <h2 style="color:#2980b9;">🔍 Email di diagnostica — Service Management</h2>
  <p>Questa è un'email di diagnostica generata su richiesta.</p>
  <div style="background-color:#f8f9fa;padding:16px;border-radius:4px;margin-bottom:24px;">
    <strong>URL DB:</strong> <code style="background:#e9ecef;padding:2px 6px;border-radius:3px;">${dbConnection}</code>
  </div>
  <h3 style="margin-top:24px;">Elenco completo certificati (${certificates.length} total${certificates.length === 1 ? "e" : "o"})</h3>
  <table style="border-collapse:collapse;width:100%;margin-top:16px;">
    <thead>
      <tr style="background-color:#2c3e50;color:#fff;">
        <th style="padding:10px 12px;text-align:left;">Identity Provider (entityID)</th>
        <th style="padding:10px 12px;text-align:center;">Uso</th>
        <th style="padding:10px 12px;text-align:center;">Data scadenza</th>
        <th style="padding:10px 12px;text-align:center;">Giorni rimanenti</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#999;">
    Questo messaggio è generato automaticamente dalla funzione <em>sm-certification-fn</em> — Service Management PagoPA.
  </p>
</body>
</html>`;
}

/**
 * Invia una email di diagnostica con l'elenco completo dei certificati e info DB.
 *
 * @param config        Configurazione applicazione (SMTP + indirizzi email)
 * @param certificates Lista completa di tutti i certificati
 */
export async function sendDiagnosticEmail(
  config: AppConfig,
  certificates: CertificateInfo[],
): Promise<void> {
  const transporter = getTransporter(config);

  await transporter.sendMail({
    from: config.fromEmail,
    to: config.alertEmail,
    subject: `[SM Certificati] Diagnostica — ${certificates.length} certificati totali`,
    html: buildDiagnosticHtmlBody(config, certificates),
  });
}

export { EXPIRY_THRESHOLD_DAYS };
