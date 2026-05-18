"use server";

import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";

import logger from "@/lib/logger/logger.server";
import { serverEnv } from "@/config/env";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { downloadLatestAzureBlobByPrefix } from "@/lib/services/azure-blob.storage";

export async function verifyContract(product: string) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/internal/v1/tokens/contract-report?onboardingId=${product}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key":
          serverEnv.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY as string,
      },
      output: z.object({
        cades: z.boolean(),
      }),
    },
  );

  if (error) {
    logServerError(error, "verifyContract - fetch error");
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
          "Ocp-Apim-Subscription-Key":
            serverEnv.FE_SMCR_API_KEY_INSTITUTION as string,
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
    logServerError(result.error, "getOnboardingByProduct - fetch error");
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

const onboardingProductsSchema = z.array(
  z.object({
    product: z.string(),
    count_current_month: z.number(),
    count_previous_month: z.number(),
    variazione_percentuale: z.number(),
  }),
);

export type OnboardingProduct = z.infer<
  typeof onboardingProductsSchema
>[number];

export async function getOnboardingProducts(): Promise<{
  data: OnboardingProduct[] | null;
  error: string | null;
}> {
  const connectionString = serverEnv.FE_SMCR_AZURE_STORAGE_CONNECTION_STRING;
  const containerNameOrUrl = serverEnv.FE_SMCR_AZURE_STORAGE_CONTAINER;
  const blobPrefix =
    serverEnv.FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX;

  if (!connectionString) {
    logger.warn(
      {
        info: {
          event: "product.onboarding.config_missing",
          actor: "smcr-ui",
          subject: "getOnboardingProducts",
          metadata: {
            hint: "FE_SMCR_AZURE_STORAGE_CONNECTION_STRING + CONTAINER + ONBOARDING_PRODUCTS_BLOB oppure ONBOARDING_PRODUCTS_BLOB come URL completo",
          },
        },
      },
      "Configurazione storage non disponibile per getOnboardingProducts",
    );
    return {
      data: null,
      error: "Configurazione storage non disponibile.",
    };
  }

  try {
    if (!blobPrefix) {
      return {
        data: null,
        error: "Nessun prefisso per i prodotti onboarding configurato.",
      };
    }

    const downloaded = await downloadLatestAzureBlobByPrefix({
      connectionString,
      containerNameOrUrl,
      blobPrefix,
    });

    if (!downloaded) {
      logger.warn(
        {
          info: {
            event: "product.onboarding.no_blob",
            actor: "smcr-ui",
            subject: "getOnboardingProducts",
            metadata: { prefix: blobPrefix },
          },
        },
        "Nessun blob trovato con prefisso per prodotti onboarding",
      );
      return {
        data: null,
        error: "Nessun file prodotti onboarding trovato nello storage.",
      };
    }

    const raw = JSON.parse(downloaded.buffer.toString("utf-8")) as unknown;
    const parsed = onboardingProductsSchema.parse(raw);
    return { data: parsed, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name === "AzureBlobEmptyBody") {
      const blobName =
        "blobName" in err && typeof err.blobName === "string"
          ? err.blobName
          : undefined;
      logger.error(
        {
          info: {
            event: "product.onboarding.empty_blob",
            actor: "smcr-ui",
            subject: "getOnboardingProducts",
            metadata: { blobName },
          },
        },
        "Blob prodotti onboarding senza contenuto",
      );
      return {
        data: null,
        error: "Si è verificato un errore nel caricamento dei prodotti.",
      };
    }
    logger.error(
      {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        info: {
          event: "product.onboarding.fetch_error",
          actor: "smcr-ui",
          subject: "getOnboardingProducts",
          metadata: {},
        },
      },
      "getOnboardingProducts: Azure Storage / parse error",
    );
    return {
      data: null,
      error: "Si è verificato un errore, riprova più tardi.",
    };
  }
}

export async function sendQueueMessage(onboarding: string) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/onboarding/${onboarding}/update`,
    {
      method: "PUT",
      headers: {
        "Ocp-Apim-Subscription-Key":
          serverEnv.FE_SMCR_API_KEY_INSTITUTION as string,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (error) {
    logServerError(error, "sendQueueMessage - fetch error");
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
