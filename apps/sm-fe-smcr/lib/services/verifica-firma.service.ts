/**
 * Servizio di verifica della firma digitale di un documento.
 *
 * La verifica viene effettuata dalla Azure Function `sm-signature-fn`,
 * raggiunta tramite il proxy interno `POST /api/signature/validate`
 * (vedi `app/api/signature/validate/route.ts`), che aggiunge la function key
 * lato server senza esporla al client.
 */

export type SignatureIndication =
  | "TOTAL_PASSED"
  | "INDETERMINATE"
  | "TOTAL_FAILED";

export type SignatureFileType = "pdf" | "p7m";

export type SignatureResult = {
  signerName: string;
  qtsp: string;
  country: string;
  indication: SignatureIndication;
  signatureLevel: string;
  signingTime: string;
  issues?: string[];
};

export type ValidationResponse = {
  fileName: string;
  fileType: SignatureFileType;
  signatures: SignatureResult[];
  totalSignatures: number;
  validSignatures: number;
};

export type ValidationResult =
  | { data: ValidationResponse; error: null }
  | { data: null; error: string };

const ACCEPTED_EXTENSIONS = ["pdf", "p7m"] as const;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function getFileType(fileName: string): SignatureFileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "p7m") return "p7m";
  return null;
}

/** Messaggi leggibili per gli stati di errore restituiti dal backend. */
function errorMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "File mancante, vuoto o troppo grande.";
    case 415:
      return "Formato file non supportato. Carica un file .pdf o .p7m.";
    case 422:
      return "Il documento non è stato riconosciuto come file firmato.";
    case 502:
      return "Servizio di validazione momentaneamente non disponibile. Riprova più tardi.";
    default:
      return "Errore durante la verifica della firma.";
  }
}

/**
 * Verifica le firme presenti in un documento (.pdf o .p7m).
 *
 * @returns risposta strutturata con l'esito di ogni firma, oppure un errore
 *          leggibile da mostrare in UI.
 */
export async function validateSignature(file: File): Promise<ValidationResult> {
  if (!getFileType(file.name)) {
    return {
      data: null,
      error: `Formato non supportato. Carica un file ${ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(" o ")}.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      data: null,
      error:
        "Il file è troppo grande. La dimensione massima consentita è 20MB.",
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/signature/validate", {
      method: "POST",
      body: formData,
    });
  } catch {
    return {
      data: null,
      error: "Impossibile contattare il servizio di verifica. Riprova.",
    };
  }

  if (!res.ok) {
    return { data: null, error: errorMessageForStatus(res.status) };
  }

  try {
    const data = (await res.json()) as ValidationResponse;
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: "Risposta del servizio non valida.",
    };
  }
}
