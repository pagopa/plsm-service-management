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
  nome: z.string().min(1, "Nome obbligatorio"),
  cognome: z.string().min(1, "Cognome obbligatorio"),
  email: z.string().optional(),
  tipologiaReferente: z.enum(tipologiaReferenteValues),
});

const dynamicsEnvironmentValues = ["UAT", "PROD"] as const;

/** Valori picklist Dynamics `pgp_oggettodelcontatto` (POST /meetings) */
export const oggettoDelContattoOptions = [
  { value: 100000000, label: "Opportunità" },
  { value: 100000001, label: "Post - Vendita" },
  { value: 100000002, label: "Informativa" },
  { value: 100000003, label: "Comunicazione" },
  { value: 100000004, label: "Pre- Sales" },
  { value: 100000005, label: "Integrazione Tecnica" },
] as const;

const oggettoDelContattoPicklistSchema = z.union([
  z.literal(100000000),
  z.literal(100000001),
  z.literal(100000002),
  z.literal(100000003),
  z.literal(100000004),
  z.literal(100000005),
]);

export const crmFormSchema = z
  .object({
    dynamicsEnvironment: z.enum(dynamicsEnvironmentValues),
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
    enableGrantAccess: z.boolean(),
    dryRun: z.boolean(),
    location: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    dataProssimoContatto: z.string().optional(),
    oggettoDelContatto: oggettoDelContattoPicklistSchema.optional(),
  })
  .refine(
    (data) => {
      const start = new Date(
        `${data.startDate}T${data.startTime.length <= 5 ? `${data.startTime}:00` : data.startTime}`,
      ).getTime();
      const end = new Date(
        `${data.endDate}T${data.endTime.length <= 5 ? `${data.endTime}:00` : data.endTime}`,
      ).getTime();
      return start < end;
    },
    {
      message: "Data e ora di inizio devono essere prima di data e ora di fine",
      path: ["endDate"],
    },
  );

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
    dynamicsEnvironment: "PROD",
    subject: "",
    startDate: toDateString(now),
    startTime: toTimeString(now),
    endDate: toDateString(now),
    endTime: toTimeString(end),
    productId: "prod-pn",
    institutionIdSelfcare: "",
    partecipanti: [],
    enableCreateContact: true,
    enableGrantAccess: false,
    dryRun: false,
    location: "",
    description: "",
    category: "",
    dataProssimoContatto: "",
    oggettoDelContatto: 100000005,
  };
}
