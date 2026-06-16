// Public contract returned to the frontend.
export type SignatureIndication =
  | "TOTAL_PASSED"
  | "INDETERMINATE"
  | "TOTAL_FAILED";

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
  fileType: "pdf" | "p7m";
  signatures: SignatureResult[];
  totalSignatures: number;
  validSignatures: number;
};

// --- Raw DSS response shapes (defensive: every field optional) ---
// NOTE: field names are best-effort and MUST be verified against a real
// DSS `validateSignature` response. Mapping logic isolates this risk.
export type DssCertificate = {
  qualifiedName?: string;
  countryName?: string;
};

export type DssCertificateChain = {
  certificate?: DssCertificate[];
};

export type DssSignature = {
  signedBy?: string;
  indication?: string;
  signatureLevel?: string;
  signingTime?: string;
  certificateChain?: DssCertificateChain;
  errors?: string[];
  warnings?: string[];
};

export type DssSimpleReport = {
  signatureOrTimestamp?: DssSignature[];
};

export type DssValidationReport = {
  simpleReport?: DssSimpleReport;
};
