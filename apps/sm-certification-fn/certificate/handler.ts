import { Timer, InvocationContext } from "@azure/functions";
import { AppConfig } from "../utils/checkConfig";
import { getConnectedClient } from "./db/database";

import { X509Certificate } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import {
  CertificateInfo,
  CertificatesByExpiration,
} from "./models/certificate";
import { insertCertificatesIntoDb } from "./db/controller";
import {
  sendExpiringCertificatesEmail,
  EXPIRY_THRESHOLD_DAYS,
} from "../utils/emailNotifier";

export const timerTrigger =
  (config: AppConfig) =>
  async (_myTimer: Timer, context: InvocationContext): Promise<void> => {
    context.log("Timer function processed request.");

    context.log(`With config ${config}`);

    const clientDB = await getConnectedClient(config);
    context.log("Connected to the database successfully.");

    try {
      console.log("Recupero dei certificati SPID in corso...");
      const certificates = await getSpidCertificates();

      if (certificates) {
        await insertCertificatesIntoDb(config)(certificates, clientDB);
        console.log(
          "✅ Certificati recuperati e raggruppati per data di scadenza:",
        );

        // Filtra i certificati in scadenza entro EXPIRY_THRESHOLD_DAYS giorni (solo futuri)
        const expiring = Array.from(certificates.values())
          .flat()
          .filter(
            (cert) =>
              cert.daysRemaining >= 0 &&
              cert.daysRemaining <= EXPIRY_THRESHOLD_DAYS,
          );

        if (expiring.length > 0) {
          context.log(
            `⚠️ ${expiring.length} certificat${expiring.length === 1 ? "o" : "i"} in scadenza entro ${EXPIRY_THRESHOLD_DAYS} giorni. Invio email a ${config.alertEmail}...`,
          );
          await sendExpiringCertificatesEmail(config, expiring);
          context.log(`📧 Email inviata a ${config.alertEmail}.`);
        } else {
          context.log(
            `✅ Nessun certificato in scadenza entro ${EXPIRY_THRESHOLD_DAYS} giorni.`,
          );
        }
      } else {
        console.log("❌ Impossibile recuperare i certificati.");
      }
    } finally {
      try {
        await clientDB.end();
        context.log("Connessione DB chiusa.");
      } catch (error) {
        console.error(
          `Errore durante la chiusura della connessione DB: ${error}`,
        );
      }
    }
  };

/**
 * Analizza un certificato in formato Base64 e ne restituisce la data di scadenza.
 * @param certData Il certificato in formato stringa Base64.
 * @returns Un oggetto Date con la data di scadenza, o null in caso di errore.
 */
function parseCertificate(certData: string): Date | null {
  try {
    // Pulisce la stringa rimuovendo spazi e ritorni a capo
    const cleanCertData = certData.replace(/\s/g, "");
    // Il costruttore di X509Certificate di Node.js accetta un Buffer
    const certBuffer = Buffer.from(cleanCertData, "base64");
    const cert = new X509Certificate(certBuffer);

    // cert.validTo è una stringa timestamp UTC, la convertiamo in un oggetto Date
    return new Date(cert.validTo);
  } catch (error) {
    console.error(`Errore nel parsing del certificato: ${error}`);
    return null;
  }
}

/**
 * Scarica, analizza e processa i certificati SPID degli Identity Provider.
 * @returns Una mappa di certificati raggruppati per data di scadenza.
 */
export async function getSpidCertificates(): Promise<CertificatesByExpiration | null> {
  const url = "https://api.is.eng.pagopa.it/idp-keys/spid/latest";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();

    // Configura il parser XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_", // Prefisso per gli attributi, es: @_entityID
    });
    const jsonObj = parser.parse(xmlText);

    const certificatesByExpiration: CertificatesByExpiration = new Map();
    const now = new Date();

    // Naviga la struttura JSON generata dall'XML
    const entities = jsonObj["md:EntitiesDescriptor"]["md:EntityDescriptor"];

    for (const entity of entities) {
      const idpId = entity["@_entityID"];

      const keyDescriptors = entity["md:IDPSSODescriptor"]["md:KeyDescriptor"];
      if (!keyDescriptors) continue;

      // keyDescriptors può essere un oggetto o un array, lo normalizziamo
      const keyDescriptorArray = Array.isArray(keyDescriptors)
        ? keyDescriptors
        : [keyDescriptors];

      for (const keyDesc of keyDescriptorArray) {
        const use = keyDesc["@_use"] || "unknown";
        const certData =
          keyDesc["ds:KeyInfo"]["ds:X509Data"]["ds:X509Certificate"];

        if (certData) {
          const expirationDate = parseCertificate(certData);
          if (expirationDate) {
            // Formatta la data in YYYY-MM-DD
            const expDateStr = expirationDate.toISOString().split("T")[0];

            // Calcola i giorni rimanenti
            const timeDiff = expirationDate.getTime() - now.getTime();
            const daysRemaining = Math.floor(timeDiff / (1000 * 3600 * 24));

            const certificateInfo: CertificateInfo = {
              idp: idpId,
              use: use,
              expirationDate: expDateStr,
              daysRemaining: daysRemaining,
              certificate: certData.replace(/\s/g, ""),
            };

            // Aggiunge il certificato alla mappa, creando l'array se non esiste
            if (!certificatesByExpiration.has(expDateStr)) {
              certificatesByExpiration.set(expDateStr, []);
            }
            certificatesByExpiration.get(expDateStr)!.push(certificateInfo);
          }
        }
      }
    }
    return certificatesByExpiration;
  } catch (error) {
    console.error(`Operazione fallita: ${error}`);
    return null;
  }
}
