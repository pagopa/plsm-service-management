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
// DSS `validateSignature` response. The real DSS casing is unconfirmed, so
// every field is accepted in BOTH camelCase and PascalCase; the mapping logic
// (dss.ts) reads whichever is present. This isolates the casing risk.
export type DssCertificate = {
  qualifiedName?: string;
  QualifiedName?: string;
  countryName?: string;
  CountryName?: string;
};

export type DssCertificateChain = {
  certificate?: DssCertificate[];
  Certificate?: DssCertificate[];
};

export type DssValueDescription = {
  value?: string;
  description?: string;
};

export type DssSignature = {
  signedBy?: string;
  SignedBy?: string;
  indication?: string;
  Indication?: string;
  signatureLevel?: string;
  SignatureLevel?: string | DssValueDescription;
  SignatureFormat?: string;
  signingTime?: string;
  SigningTime?: string;
  BestSignatureTime?: string;
  certificateChain?: DssCertificateChain;
  CertificateChain?: DssCertificateChain;
  errors?: string[];
  Errors?: string[];
  warnings?: string[];
  Warnings?: string[];
};

export type DssSignatureOrTimestampOrEvidenceRecord = {
  Signature?: DssSignature;
};

export type DssSimpleReport = {
  signatureOrTimestamp?: DssSignature[];
  SignatureOrTimestamp?: DssSignature[];
  signatureOrTimestampOrEvidenceRecord?: DssSignatureOrTimestampOrEvidenceRecord[];
  SignatureOrTimestampOrEvidenceRecord?: DssSignatureOrTimestampOrEvidenceRecord[];
  signatures?: DssSignature[];
  Signatures?: DssSignature[];
};

export type DssValidationReport = {
  simpleReport?: DssSimpleReport;
  SimpleReport?: DssSimpleReport;
};
