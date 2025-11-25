import * as z from "zod";
import { stepOneRefinementValidation } from "./stepOneRefinementValidation";
import {
  additionalInformationsSchema,
  baseSchemaStepOne,
  pspSchema,
  subunitSchema,
} from "./stepOneSchema";
import { stepTwoSchema } from "./stepTwoSchema";

export const onboardingSchema = baseSchemaStepOne
  .and(pspSchema)
  .and(additionalInformationsSchema)
  .and(subunitSchema)
  .and(stepTwoSchema)
  .superRefine(stepOneRefinementValidation);

export type OnboardingSchema = z.infer<typeof onboardingSchema>;
