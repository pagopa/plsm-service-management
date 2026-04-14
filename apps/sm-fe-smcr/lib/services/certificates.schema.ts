import { z } from "zod";

export const CertificateSchema = z.object({
  idp: z.string(),
  use: z.string().optional(),
  expiration_date: z.string(),
  days_remaining: z.number(),
  certificate: z.string().optional(),
});

export type Certificate = z.infer<typeof CertificateSchema>;

export const CertificatesListSchema = z.array(CertificateSchema);
