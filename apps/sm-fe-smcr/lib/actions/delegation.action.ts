"use server";

import z from "zod";
import {
  addDelegation,
  deleteDelegation,
} from "../services/delegations.service";
import { validateFormData } from "../utils";

const addDelegationSchema = z
  .object({
    from: z
      .uuid({ message: "L'ID Ente delegante non è un UUID valido" })
      .trim(),
    institutionFromName: z
      .string()
      .trim()
      .min(2, {
        message: "Il nome Ente delegante deve contenere almeno 2 caratteri",
      })
      .max(120, {
        message: "Il nome Ente delegante può avere al massimo 120 caratteri",
      }),
    to: z.uuid({ message: "L'ID Ente delegante non è un UUID valido" }).trim(),
    institutionToName: z
      .string()
      .trim()
      .min(2, {
        message: "Il nome Ente delegato deve contenere almeno 2 caratteri",
      })
      .max(120, {
        message: "Il nome Ente delegato può avere al massimo 120 caratteri",
      }),
    taxCodeTo: z
      .string()
      .transform((v) => v.replace(/\s+/g, ""))
      .refine((v) => /^\d{11}$/.test(v), {
        message:
          "Il codice fiscale delegato deve contenere esattamente 11 cifre",
      }),
    productId: z.string().trim().min(1, { message: "Prodotto è obbligatorio" }),
    type: z.string().trim().min(1, { message: "Tipo è obbligatorio" }),
  })
  .strict();

export type AddDelegationInput = z.infer<typeof addDelegationSchema>;

export type AddDelegationFormState = {
  fields: Partial<AddDelegationInput>;
  errors?: Partial<AddDelegationInput> & { root?: string };
};

export async function addDelegationAction(
  prevState: AddDelegationFormState,
  formData: FormData,
): Promise<AddDelegationFormState> {
  const { input, errors } = validateFormData(addDelegationSchema, formData);

  if (errors) {
    return { fields: input, errors };
  }

  const { error } = await addDelegation(input);

  if (error) {
    console.error("Errore durante il salvataggio della delega:", error);

    return {
      fields: input,
      errors: { root: "Errore imprevisto durante l'invio della delega." },
    };
  }

  return { fields: { ...input } };
}

const deleteDelegaationSchema = z.object({
  id: z.uuid({ message: "L'ID Ente delegante non è un UUID valido" }).trim(),
});

export type DeleteDelegationInput = z.infer<typeof deleteDelegaationSchema>;

export type DeleteDelegationFormState = {
  fields: Partial<DeleteDelegationInput>;
  errors?: Partial<DeleteDelegationInput> & { root?: string };
};

export async function deleteDelegationAction(
  prevState: DeleteDelegationFormState,
  formData: FormData,
): Promise<DeleteDelegationFormState> {
  const { input, errors } = validateFormData(deleteDelegaationSchema, formData);

  if (errors) {
    return { fields: input, errors };
  }

  const { error } = await deleteDelegation(input);
  if (error) {
    console.error("Errore durante l'eliminazione della delega:", error);

    return {
      fields: input,
      errors: { root: "Errore imprevisto l'eliminazione della delega." },
    };
  }

  return { fields: { ...input } };
}
