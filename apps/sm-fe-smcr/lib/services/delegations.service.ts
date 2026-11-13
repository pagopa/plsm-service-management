"use server";

import { betterFetch } from "@better-fetch/fetch";
import z from "zod";
import {
  AddDelegationInput,
  DeleteDelegationInput,
} from "../actions/delegation.action";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { serverEnv } from "@/config/env";

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
        "Ocp-Apim-Subscription-Key":
          serverEnv.FE_SMCR_API_KEY_INSTITUTION as string,
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
        "Ocp-Apim-Subscription-Key":
          serverEnv.FE_SMCR_API_KEY_INSTITUTION as string,
        "Content-Type": "application/json",
      },
      output: z.any(),
    },
  );

  if (error) {
    if (error.status === 409) {
      return { data: null, error: "Delegaa già presente." };
    }

    logServerError(error, "addDelegation - fetch error");
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
        "Ocp-Apim-Subscription-Key":
          serverEnv.FE_SMCR_API_KEY_INSTITUTION as string,
      },
    },
  );

  if (error) {
    logServerError(error, "deleteDelegation - fetch error");
    return { data: null, error: "Error adding delegation" };
  }

  return { data, error: null };
}

const aggregateDelegationSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  institutionName: z.string().optional(),
  institutionType: z.string().optional(),
  taxCode: z.string().optional(),
  productId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const delegationsWithPaginationSchema = z.object({
  delegations: z.array(aggregateDelegationSchema),
  pageInfo: z
    .object({
      pageNo: z.number(),
      pageSize: z.number(),
      totalElements: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

export type AggregateDelegation = z.infer<typeof aggregateDelegationSchema>;

const AGGREGATES_PAGE_SIZE = 100;
// Safety cap on pages fetched (100 x 50 = 5000 aggregated entities).
const AGGREGATES_MAX_PAGES = 50;

export async function getAggregatedInstitutions(
  brokerId: string,
  productId: string,
): Promise<
  | { data: Array<AggregateDelegation>; error: null }
  | { data: []; error: string }
> {
  const delegations: Array<AggregateDelegation> = [];

  for (let page = 0; page < AGGREGATES_MAX_PAGES; page++) {
    const params = new URLSearchParams({
      brokerId,
      productId,
      page: String(page),
      size: String(AGGREGATES_PAGE_SIZE),
      type: "EA",
    });

    const { data, error } = await betterFetch(
      `https://api.selfcare.pagopa.it/external/support/v1/delegations/delegations-with-pagination?${params}`,
      {
        output: delegationsWithPaginationSchema,
        headers: {
          "Ocp-Apim-Subscription-Key":
            serverEnv.FE_SMCR_API_KEY_INSTITUTION as string,
        },
      },
    );

    if (error || !data) {
      logServerError(error, "getAggregatedInstitutions - fetch error");
      return { data: [], error: "Errore nel recupero degli enti aggregati" };
    }

    delegations.push(...data.delegations);

    const totalPages = data.pageInfo?.totalPages;
    const isLastPage =
      totalPages != null
        ? page + 1 >= totalPages
        : data.delegations.length < AGGREGATES_PAGE_SIZE;

    if (isLastPage) {
      break;
    }
  }

  return { data: delegations, error: null };
}
