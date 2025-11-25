import * as z from "zod";

export const getInfocamereSchema = z.object({
  businessTaxId: z.string().optional(),
  businessName: z.string().optional(),
  legalNature: z.string().optional(),
  legalNatureDescription: z.string().optional(),
  cciaa: z.string().optional(),
  nRea: z.string().optional(),
  businessStatus: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  digitalAddress: z.string().optional(),
});
export type GetInfocamereSchema = z.infer<typeof getInfocamereSchema>;
