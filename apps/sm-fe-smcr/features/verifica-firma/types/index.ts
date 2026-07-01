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
