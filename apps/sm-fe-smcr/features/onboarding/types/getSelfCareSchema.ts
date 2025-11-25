import * as z from "zod";
import {
  apiOriginValues,
  institutionValues,
  TAXCODE_BUSINESS_LENGTH,
} from "../utils/constants";

const baseSchema = z.object({
  institutions: z.array(
    z.object({
      id: z.string(),
      externalId: z.string(),
      origin: z.enum(apiOriginValues),
      originId: z.string(),
      description: z.string(),
      digitalAddress: z.string(),
      address: z.string(),
      zipCode: z.string().length(5),
      taxCode: z.string().length(TAXCODE_BUSINESS_LENGTH),
      city: z.string(),
      county: z.string(),
      country: z.string(),
      istatCode: z.string(),
      onboarding: z.array(
        z.object({
          productId: z.string(),
          institutionType: z.enum(institutionValues),
          billing: z.object({
            vatNumber: z.string().optional(),
            recipientCode: z.string().optional(),
            publicServices: z.boolean(),
          }),
        }),
      ),
      geographicTaxonomies: z
        .array(
          z
            .object({
              code: z.string().optional(),
              desc: z.string().optional(),
            })
            .optional(),
        )
        .optional(),
    }),
  ),
});

const paymentServiceProviderSchema = z
  .object({
    paymentServiceProvider: z
      .object({
        abiCode: z.string(),
        businessRegisterNumber: z.string(),
        legalRegisterNumber: z.string(),
        legalRegisterName: z.string(),
        vatNumberGroup: z.boolean(),
      })
      .optional(),
  })
  .optional();

const supportEmailSchema = z
  .object({
    supportEmail: z.string().optional(),
  })
  .optional();

export const getSelfCareSchema = baseSchema
  .and(paymentServiceProviderSchema)
  .and(supportEmailSchema);

export type GetSelfCareSchema = z.infer<typeof getSelfCareSchema>;
