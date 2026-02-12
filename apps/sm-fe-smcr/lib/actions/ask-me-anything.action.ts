"use server";

import {
  createAskMeAnythingMember,
  deleteAskMeAnythingMember,
  updateAskMeAnythingMember,
} from "@/lib/services/ask-me-anything.service";
import { validateFormData } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import z from "zod";

const booleanField = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const memberBaseSchema = z.object({
  firstname: z.string().min(1, "Il nome è obbligatorio"),
  lastname: z.string().min(1, "Il cognome è obbligatorio"),
  email: z.email("Email non valida"),
  selfcareAccess: booleanField,
  legalAccess: booleanField,
});

const createAskMeAnythingMemberSchema = memberBaseSchema;
const updateAskMeAnythingMemberSchema = memberBaseSchema.extend({
  id: z.coerce.number().int(),
});
const deleteAskMeAnythingMemberSchema = z.object({
  id: z.coerce.number().int(),
});

export type AskMeAnythingMemberFormValues = z.infer<typeof memberBaseSchema> & {
  id?: number;
};

export type AskMeAnythingMemberFormState = {
  data: Partial<AskMeAnythingMemberFormValues>;
  error: (Partial<AskMeAnythingMemberFormValues> & { root?: string }) | null;
};

const initialActionState: AskMeAnythingMemberFormState = {
  data: {},
  error: null,
};

export async function createAskMeAnythingMemberAction(
  _prevState: AskMeAnythingMemberFormState = initialActionState,
  formData: FormData,
): Promise<AskMeAnythingMemberFormState> {
  const { input, errors } = validateFormData(
    createAskMeAnythingMemberSchema,
    formData,
  );

  if (errors) {
    return { data: input, error: errors };
  }

  const result = await createAskMeAnythingMember(input);
  if (result.error) {
    console.error("createAskMeAnythingMemberAction - error", result.error);
    return {
      data: input,
      error: {
        ...result.error.fields,
        root: result.error.message ?? "Si è verificato un errore.",
      },
    };
  }

  revalidatePath("/dashboard/ask-me-anything");

  return { data: input, error: null };
}

export async function updateAskMeAnythingMemberAction(
  _prevState: AskMeAnythingMemberFormState = initialActionState,
  formData: FormData,
): Promise<AskMeAnythingMemberFormState> {
  const { input, errors } = validateFormData(
    updateAskMeAnythingMemberSchema,
    formData,
  );

  if (errors) {
    return { data: input, error: errors };
  }

  const result = await updateAskMeAnythingMember(input);
  if (result.error) {
    console.error("updateAskMeAnythingMemberAction - error", result.error);
    return {
      data: input,
      error: {
        ...result.error.fields,
        root: result.error.message ?? "Si è verificato un errore.",
      },
    };
  }

  revalidatePath("/dashboard/ask-me-anything");

  return { data: input, error: null };
}

export async function deleteAskMeAnythingMemberAction(
  _prevState: AskMeAnythingMemberFormState = initialActionState,
  formData: FormData,
): Promise<AskMeAnythingMemberFormState> {
  const { input, errors } = validateFormData(
    deleteAskMeAnythingMemberSchema,
    formData,
  );

  if (errors) {
    return { data: input, error: errors };
  }

  const result = await deleteAskMeAnythingMember(input);
  if (result.error) {
    console.error("deleteAskMeAnythingMemberAction - error", result.error);
    return {
      data: input,
      error: {
        ...result.error.fields,
        root: result.error.message ?? "Si è verificato un errore.",
      },
    };
  }

  revalidatePath("/dashboard/ask-me-anything");

  return { data: input, error: null };
}
