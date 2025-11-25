"use server";

import z from "zod";
import { sendQueueMessage } from "../services/product.service";

const sendToQueueSchema = z.object({
  onboarding: z.string(),
});

type SendToQueueInput = z.infer<typeof sendToQueueSchema>;

export type SendToQueueFormState = {
  fields: Partial<SendToQueueInput>;
  errors?: { root?: string };
};

export async function sendToQueueAction(
  prevState: any,
  formData: FormData,
): Promise<SendToQueueFormState> {
  const input = Object.fromEntries(formData.entries());
  const validation = sendToQueueSchema.safeParse(input);

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

  const { error } = await sendQueueMessage(validation.data.onboarding);

  if (error) {
    console.error(error);
    return {
      fields: validation.data,
      errors: { root: "Si è verificato un errore, riprova più tardi." },
    };
  }

  return { fields: validation.data };
}
