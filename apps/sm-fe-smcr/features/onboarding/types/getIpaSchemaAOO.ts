import * as z from "zod";
import { apiOriginValues } from "../utils/constants";

export const getIpaSchemaAOO = z.object({
  id: z.string().optional(),
  denominazioneAoo: z.string().optional(),
  codiceFiscaleEnte: z.string().optional(),
  mail1: z.string().optional(),
  origin: z.enum(apiOriginValues).optional(),
  CAP: z.string().optional(),
  indirizzo: z.string().optional(),
});
export type GetIpaSchemaAOO = z.infer<typeof getIpaSchemaAOO>;
