"use server";

import { redirect } from "next/navigation";
import z from "zod";
import {
  updateInstitutionInfo,
  updateInstitutionInfoPNPG,
} from "../services/institution.service";
import { sendQueueMessage } from "../services/product.service";

const updateInstitutionSchema = z.object({
  redirect: z.string().nonempty(),
  institutionId: z.string().nonempty(),
  address: z.string().nonempty(),
  description: z.string().nonempty(),
  digitalAddress: z.string().nonempty(),
  zipCode: z.string().nonempty(),
  sendToQueue: z.string().transform((v) => v === "true"),
  onboarding: z.string().optional().nullable(),
  isPNPG: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  onboardings: z.preprocess(
    (value) => JSON.parse(value as string),
    z.array(
      z.object({
        productId: z.string().nonempty(),
        vatNumber: z.string().nonempty(),
      }),
    ),
  ),
});

type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;

export type UpdateInstitutionFormState = {
  fields: Partial<UpdateInstitutionInput>;
  errors?: { root?: string };
};

export async function updateInstitutionAction(
  prevState: UpdateInstitutionFormState,
  formData: FormData,
): Promise<any> {
  const input = Object.fromEntries(formData.entries());
  const validation = updateInstitutionSchema.safeParse(input);

  const isPNPG = validation.success && validation.data.isPNPG ? true : false;

  if (!validation.success) {
    const errors: Record<string, string> = {};

    for (const issue of validation.error.issues) {
      if (issue.path.length > 0) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
    }

    return { fields: input, errors };
  }

  const { error } = isPNPG
    ? await updateInstitutionInfoPNPG({
        institutionId: validation.data?.institutionId,
        address: validation.data.address,
        description: validation.data.description,
        digitalAddress: validation.data.digitalAddress,
        zipCode: validation.data.zipCode,
        onboardings: validation.data?.onboardings,
      })
    : await updateInstitutionInfo({
        institutionId: validation.data?.institutionId,
        address: validation.data.address,
        description: validation.data.description,
        digitalAddress: validation.data.digitalAddress,
        zipCode: validation.data.zipCode,
        onboardings: validation.data?.onboardings,
      });

  if (error) {
    return {
      fields: { ...input },
      errors: { root: "An error occurred, please try again later." },
    };
  }

  if (validation.data.sendToQueue && validation.data.onboarding) {
    await sendQueueMessage(validation.data.onboarding);
  }

  redirect(validation.data.redirect);
}
