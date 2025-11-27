"use server";

import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";

export async function verifyContract(product: string) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/internal/v1/tokens/contract-report?onboardingId=${product}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY as string,
      },
      output: z.object({
        cades: z.boolean(),
      }),
    },
  );

  if (error) {
    console.error(error);
    return false;
  }

  return data.cades;
}

export async function getOnboardingByProduct(
  product: string,
  startDate: string,
  endDate: string,
) {
  const result = await withRetry(() =>
    betterFetch(
      `https://api.selfcare.pagopa.it/external/support/v1/api/onboardings/notifications/count?from=${startDate}&to=${endDate}&productId=${product}`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env
            .FE_SMCR_API_KEY_INSTITUTION as string,
        },
        output: z.array(
          z.object({
            productId: z.string(),
            notificationCount: z.number(),
          }),
        ),
      },
    ),
  );

  if (result.error) {
    console.error(result.error);
    return {
      data: null,
      error: "Si è verificato un errore, riprova più tardi.",
    };
  }

  return {
    data: result.data?.at(0) ?? { productId: product, notificationCount: 0 },
    error: null,
  };
}

export async function sendQueueMessage(onboarding: string) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/onboarding/${onboarding}/update`,
    {
      method: "PUT",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (error) {
    console.error(error);
    return {
      data: null,
      error: "Si è verificato un errore, riprova più tardi.",
    };
  }

  return { data, error: null };
}

type FetchResult<T> = Promise<{ data: T; error: unknown }>;

async function withRetry<T>(
  operation: () => FetchResult<T>,
  options: { retries?: number; baseDelay?: number } = {},
) {
  const retries = options.retries ?? 3;
  const baseDelay = options.baseDelay ?? 300;
  let attempt = 0;
  let result = await operation();

  while (result.error && shouldRetry(result.error) && attempt < retries - 1) {
    const wait = baseDelay * 2 ** attempt;
    await delay(wait);
    attempt += 1;
    result = await operation();
  }

  return result;
}

function shouldRetry(error: unknown) {
  if (!error || typeof error !== "object") {
    return true;
  }

  const status = (error as { status?: number }).status;
  if (typeof status === "number") {
    return status === 429 || status >= 500;
  }

  return true;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
