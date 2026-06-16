import type { AppConfig } from "../utils/checkConfig";
import type {
  DssSignature,
  DssValidationReport,
  SignatureIndication,
  SignatureResult,
  ValidationResponse,
} from "./models/signature";

const VALID_INDICATIONS: SignatureIndication[] = [
  "TOTAL_PASSED",
  "INDETERMINATE",
  "TOTAL_FAILED",
];

function normalizeIndication(raw?: string): SignatureIndication {
  return VALID_INDICATIONS.includes(raw as SignatureIndication)
    ? (raw as SignatureIndication)
    : "INDETERMINATE";
}

// The QTSP/issuer is the last entry in the certificate chain; the signer is the
// first. Best-effort extraction, defensive against missing fields.
function extractTrustAnchor(sig: DssSignature): {
  qtsp: string;
  country: string;
} {
  const chain = sig.certificateChain?.certificate ?? [];
  const anchor = chain.length > 0 ? chain[chain.length - 1] : undefined;
  return {
    qtsp: anchor?.qualifiedName ?? "",
    country: anchor?.countryName ?? "",
  };
}

function mapSignature(sig: DssSignature): SignatureResult {
  const { qtsp, country } = extractTrustAnchor(sig);
  return {
    signerName: sig.signedBy ?? "",
    qtsp,
    country,
    indication: normalizeIndication(sig.indication),
    signatureLevel: sig.signatureLevel ?? "",
    signingTime: sig.signingTime ?? "",
    issues: [...(sig.errors ?? []), ...(sig.warnings ?? [])],
  };
}

export function mapDssResponse(
  report: DssValidationReport,
  fileName: string,
  fileType: "pdf" | "p7m",
): ValidationResponse {
  const raw = report.simpleReport?.signatureOrTimestamp;
  const rawSignatures = (Array.isArray(raw) ? raw : []).filter(
    (s): s is DssSignature => Boolean(s),
  );
  const signatures = rawSignatures.map(mapSignature);
  return {
    fileName,
    fileType,
    signatures,
    totalSignatures: signatures.length,
    validSignatures: signatures.filter((s) => s.indication === "TOTAL_PASSED")
      .length,
  };
}

export class DssApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DssApiError";
  }
}

export async function callDssApi(
  config: AppConfig,
  bytesBase64: string,
  fileName: string,
): Promise<DssValidationReport> {
  const url = `${config.dssApiBaseUrl}/services/rest/validation/validateSignature`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signedDocument: { bytes: bytesBase64, name: fileName },
        policy: null,
        tokenExtractionStrategy: "NONE",
      }),
    });
  } catch (err) {
    throw new DssApiError(
      `DSS unreachable: ${err instanceof Error ? err.message : String(err)}`,
      502,
    );
  }

  if (response.status === 500) {
    // DSS returns HTTP 500 with a plain-text body for unrecognized documents.
    // Only treat it as a client-side 422 when the body matches that signature;
    // any other 500 is a genuine DSS server error and must surface as 502.
    const body = await response.text().catch(() => "");
    if (/not recognized|format not recognized|not handled/i.test(body)) {
      throw new DssApiError("Document format not recognized", 422);
    }
    throw new DssApiError(`DSS error 500: ${body.slice(0, 200)}`, 502);
  }
  if (!response.ok) {
    throw new DssApiError(`DSS error ${response.status}`, 502);
  }
  return (await response.json()) as DssValidationReport;
}
