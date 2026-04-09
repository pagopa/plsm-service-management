import { z } from "zod";

export const signatureIdentifierModeSchema = z.enum([
  "fiscal_code",
  "vat_number",
]);

export type SignatureIdentifierMode = z.infer<
  typeof signatureIdentifierModeSchema
>;

export const SignatureFormSchema = z
  .object({
    signature_request: z.string().min(1, "Il campo è obbligatorio"),
    identifier_mode: signatureIdentifierModeSchema,
    fiscal_code: z.string(),
    vat_number: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.identifier_mode === "fiscal_code") {
      const cf = data.fiscal_code.trim();
      if (!cf) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Inserisci il codice fiscale del firmatario",
          path: ["fiscal_code"],
        });
      } else if (cf.length !== 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Il codice fiscale deve essere lungo 16 caratteri",
          path: ["fiscal_code"],
        });
      }
    } else {
      const vat = data.vat_number.trim();
      if (!vat) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Inserisci la partita IVA dell'ente",
          path: ["vat_number"],
        });
      } else if (!/^\d{11}$/.test(vat)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La partita IVA deve essere composta da 11 cifre",
          path: ["vat_number"],
        });
      }
    }
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
