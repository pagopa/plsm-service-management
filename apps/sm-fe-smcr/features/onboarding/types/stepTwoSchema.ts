import * as z from "zod";
import { roleValues, TAXCODE_PRIVATE_LENGTH } from "../utils/constants";

export const stepTwoSchema = z.object({
  users: z.array(
    z.object({
      name: z.string().min(1, "Il campo Nome è obbligatorio"),
      surname: z.string().min(1, "Il campo Cognome è obbligatorio"),
      email: z.string().min(1, "Il campo Email è obbligatorio"),
      role: z.enum(roleValues),
      taxCode: z
        .string()
        .length(
          TAXCODE_PRIVATE_LENGTH,
          `Il campo Codice fiscale deve avere ${TAXCODE_PRIVATE_LENGTH} caratteri`
        ),
    })
  ),
});

export type StepTwoSchema = z.infer<typeof stepTwoSchema>;

export const defaultValues: StepTwoSchema = {
  users: [
    {
      name: "",
      surname: "",
      email: "",
      role: "MANAGER",
      taxCode: "",
    },
  ],
};
