import { z } from "zod";

export const SignatureFormSchema = z.object({
  signature_request: z.string().min(1, "Il campo è obbligatorio"),
  fiscal_code: z.string().min(1, "Il campo è obbligatorio"),
});

export const SignIDFormSchema = z.object({
  fiscal_code: z.string().min(1, "Il campo è obbligatorio"),
});

export const SignatureCoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const SignatureSizeSchema = z.object({
  w: z.number(),
  h: z.number(),
});

export const SignatureAttrsSchema = z.object({
  coordinates: SignatureCoordinatesSchema,
  size: SignatureSizeSchema,
  page: z.number(),
});

export const SignatureClauseSchema = z.object({
  title: z.string(),
  type: z.string(),
});

export const SignatureFieldSchema = z.object({
  clause: SignatureClauseSchema,
  attrs: SignatureAttrsSchema,
});

export const DocumentMetadataSchema = z.object({
  title: z.string(),
  signature_fields: z.array(SignatureFieldSchema),
});

export const DocumentSchema = z.object({
  id: z.string(),
  metadata: DocumentMetadataSchema,
  created_at: z.string(),
  updated_at: z.string(),
  status: z.literal("READY"),
  uploaded_at: z.string(),
  url: z.string().url(),
});

export const FirmaConIOSchema = z.object({
  id: z.string(),
  dossier_id: z.string(),
  signer_id: z.string(),
  issuer_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string(),
  documents: z.array(DocumentSchema),
  status: z.enum([
    "WAIT_FOR_SIGNATURE",
    "SIGNED",
    "EXPIRED",
    "CANCELLED",
    "REJECTED",
  ]),
  rejected_at: z.string().optional(),
  reject_reason: z.string().optional(),
});

export type FirmaConIODocument = z.infer<typeof DocumentSchema>;
export type FirmaConIO = z.infer<typeof FirmaConIOSchema>;
