import { z } from "zod";
import {
  AOO_CODE_LENGTH,
  productKeys,
  subunitValues,
  TAXCODE_BUSINESS_LENGTH,
  UO_CODE_LENGTH,
} from "../utils/constants";

export const statusSchema = z
  .object({
    taxcode: z.string().min(TAXCODE_BUSINESS_LENGTH, {
      message: `Il codice fiscale deve essere di ${TAXCODE_BUSINESS_LENGTH} caratteri`,
    }),
    subunit: z.enum(subunitValues),
    productId: z.enum(productKeys),
    subunitCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.subunit === "AOO") {
      if (data.subunitCode?.length !== AOO_CODE_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Il campo univoco di una AOO deve avere ${AOO_CODE_LENGTH} caratteri`,
          path: ["subunitCode"],
        });
      }
    }
    if (data.subunit === "UO") {
      if (data.subunitCode?.length !== UO_CODE_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Il codice univoco di una UO deve avere ${UO_CODE_LENGTH} caratteri`,
          path: ["subunitCode"],
        });
      }
    }
  });
export type StatusSchema = z.infer<typeof statusSchema>;
