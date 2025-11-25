import * as z from "zod";

export const getIpaSchema = z.object({
  id: z.string().optional(),
  originId: z.string().optional(),
  taxCode: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  digitalAddress: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  origin: z.string().optional(),
  istatCode: z.string().optional(),
});
export type GetIpaSchema = z.infer<typeof getIpaSchema>;
