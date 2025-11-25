import * as z from "zod";
import {
  apiOriginValues,
  institutionValues,
  productKeys,
  subunitValues,
  TAXCODE_BUSINESS_LENGTH,
  ZIPCODE_LENGTH,
} from "../utils/constants";
import { stepOneRefinementValidation } from "./stepOneRefinementValidation";

export const additionalInformationsSchema = z.object({
  belongRegulatedMarket: z.boolean().optional(),
  regulatedMarketNote: z.string().optional(),
  ipa: z.boolean().optional(),
  ipaCode: z.string().optional(),
  establishedByRegulatoryProvision: z.boolean().optional(),
  establishedByRegulatoryProvisionNote: z.string().optional(),
  agentOfPublicService: z.boolean().optional(),
  agentOfPublicServiceNote: z.string().optional(),
  otherNote: z.string().optional(),
  rea: z.string().optional(),
});

export const baseSchemaStepOne = z.object({
  institutionType: z.enum(institutionValues),
  businessName: z.string().min(1),
  digitalAddress: z.string().min(1),
  recipientCode: z.string().optional(),
  registeredOffice: z.string().min(1),
  taxcode: z.string().length(TAXCODE_BUSINESS_LENGTH),
  subunit: z.enum(subunitValues),
  vatNumber: z.string().optional(),
  istatCode: z.string().min(1),
  city: z.string().min(1),
  county: z.string().min(1),
  country: z.string().min(1),
  origin: z.enum(apiOriginValues),
  originId: z.string().min(3),
  productId: z.enum(productKeys),
  zipCode: z.string().length(ZIPCODE_LENGTH),
  id: z.string().optional(),
  externalId: z.string().optional(),
  supportEmail: z.string().optional(),
  isPIVANull: z.boolean(),
  isPIVAequalToTaxcode: z.boolean(),
});

export const pspSchema = z.object({
  abiCode: z.string().optional(),
  businessRegisterNumber: z.string().optional(),
  address: z.string().optional(),
  pec: z.string().optional(),
  email: z.string().optional(),
  legalRegisterNumber: z.string().optional(),
  legalRegisterName: z.string().optional(),
  vatNumberGroup: z.boolean().optional(),
  code: z.string().optional(),
  desc: z.string().optional(),
});

export const subunitSchema = z.object({
  subunitCode: z.string().optional(),
  subunitType: z.string().optional(),
});

export const stepOneSchema = baseSchemaStepOne
  .and(pspSchema)
  .and(additionalInformationsSchema)
  .and(subunitSchema)
  .superRefine(stepOneRefinementValidation);

export type StepOneSchema = z.infer<typeof stepOneSchema>;

export const defaultValues: StepOneSchema = {
  subunit: "Apicale",
  businessName: "",
  digitalAddress: "",
  recipientCode: "",
  registeredOffice: "",
  taxcode: "",
  vatNumber: "",
  city: "",
  county: "",
  country: "",
  istatCode: "",
  institutionType: "PA",
  origin: "IPA",
  originId: "",
  productId: "",
  zipCode: "",
  id: "",
  externalId: "",
  supportEmail: "",
  // institutionType === "GSP" && productId === "prod-pagopa"
  belongRegulatedMarket: false,
  regulatedMarketNote: "",
  ipa: false,
  ipaCode: "",
  establishedByRegulatoryProvision: false,
  establishedByRegulatoryProvisionNote: "",
  agentOfPublicService: false,
  agentOfPublicServiceNote: "",
  otherNote: "",
  rea: "",
  // institutionType === "PSP"
  abiCode: "",
  businessRegisterNumber: "",
  address: "",
  pec: "",
  email: "",
  legalRegisterNumber: "",
  legalRegisterName: "",
  vatNumberGroup: false,
  code: "",
  desc: "",
  subunitCode: "",
  subunitType: "",
  isPIVANull: false,
  isPIVAequalToTaxcode: false,
};
