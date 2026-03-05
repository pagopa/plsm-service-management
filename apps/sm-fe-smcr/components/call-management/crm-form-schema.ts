import { z } from "zod";

const productIds = [
  "prod-io",
  "prod-interop",
  "prod-pn",
  "prod-pagopa",
  "prod-io-sign",
] as const;

export const tipologiaReferenteValues = [
  "APICALE",
  "DIRETTO",
  "TECNICO",
  "BUSINESS",
  "ACCOUNT",
  "RESPONSABILE_DI_TRASFORMAZIONE_DIGITALE",
  "REFERENTE_CONTRATTUALE",
  "RESPONSABILE_PROTEZIONE_DATI",
  "REFERENTE_BUSINESS_APICALE_ACCOUNT",
] as const;

export const partecipanteSchema = z.object({
  nome: z.string().optional(),
  cognome: z.string().optional(),
  email: z.string().min(1, "Email obbligatoria").email("Email non valida"),
  tipologiaReferente: z.enum(tipologiaReferenteValues),
});

export const crmFormSchema = z
  .object({
    subject: z.string().min(1, "Inserire l'oggetto"),
    startDate: z.string().min(1, "Data inizio obbligatoria"),
    startTime: z.string().min(1, "Ora inizio obbligatoria"),
    endDate: z.string().min(1, "Data fine obbligatoria"),
    endTime: z.string().min(1, "Ora fine obbligatoria"),
    productId: z.enum(productIds, {
      error: "Seleziona un prodotto",
    }),
    institutionIdSelfcare: z.string().uuid("Seleziona un'istituzione"),
    partecipanti: z
      .array(partecipanteSchema)
      .min(1, "Aggiungi almeno un partecipante"),
    enableCreateContact: z.boolean(),
    description: z.string().optional(),
  })
  .refine((data) => data.partecipanti.some((p) => p.email?.trim().length > 0), {
    message: "Almeno un partecipante deve avere un'email",
    path: ["partecipanti"],
  });

export type CrmFormSchema = z.infer<typeof crmFormSchema>;
export type PartecipanteForm = z.infer<typeof partecipanteSchema>;

function toTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  return `${h}:00`;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getCrmFormDefaultValues(): CrmFormSchema {
  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    subject: "",
    startDate: toDateString(now),
    startTime: toTimeString(now),
    endDate: toDateString(now),
    endTime: toTimeString(end),
    productId: "prod-pn",
    institutionIdSelfcare: "",
    partecipanti: [],
    enableCreateContact: true,
    description: "",
  };
}
