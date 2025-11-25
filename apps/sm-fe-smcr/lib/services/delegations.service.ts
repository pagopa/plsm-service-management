"use server";

import { betterFetch } from "@better-fetch/fetch";
import z from "zod";
import {
  AddDelegationInput,
  DeleteDelegationInput,
} from "../actions/delegation.action";

const delegationSchema = z
  .object({
    id: z.uuid(),
    institutionId: z.uuid(),
    institutionName: z.string().min(1),
    institutionRootName: z.string().optional(),
    type: z.string(),
    productId: z.string(),
    taxCode: z.string().regex(/^\d{11}$/, "Must be 11 digits"),
    institutionType: z.string(),
    brokerId: z.uuid(),
    brokerTaxCode: z.string().regex(/^\d{11}$/, "Must be 11 digits"),
    brokerType: z.string(),
    brokerName: z.string().min(1),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  })
  .strict();

export type Delegation = z.infer<typeof delegationSchema>;

export async function getDelegations(institutionId: string) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/delegations?institutionId=${institutionId}`,
    {
      output: z.array(delegationSchema),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.API_KEY_INSTITUTION as string,
      },
    },
  );

  return { data, error };
}

export async function addDelegation(input: AddDelegationInput) {
  const { data, error } = await betterFetch(
    "https://api.selfcare.pagopa.it/external/support/v1/delegations",
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.API_KEY_INSTITUTION as string,
        "Content-Type": "application/json",
      },
      output: z.any(),
    },
  );

  if (error) {
    if (error.status === 409) {
      return { data: null, error: "Delegaa già presente." };
    }

    console.error({ error });
    return { data: null, error: "Error adding delegation" };
  }

  return { data, error: null };
}

export async function deleteDelegation(input: DeleteDelegationInput) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/delegations/${input.id}`,
    {
      method: "DELETE",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.API_KEY_INSTITUTION as string,
      },
    },
  );

  if (error) {
    console.error({ error });
    return { data: null, error: "Error adding delegation" };
  }

  return { data, error: null };
}
