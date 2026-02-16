"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { betterFetch } from "@better-fetch/fetch";
import { Readable } from "node:stream";
import { z } from "zod";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

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

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.FE_SMCR_AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER =
  process.env.FE_SMCR_AZURE_STORAGE_CONTAINER ?? "config";
const AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX =
  process.env.FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX;

function normalizeConnectionString(connectionString: string): string {
  const s = connectionString.trim();
  if (/^(https?);/.test(s) && !/^DefaultEndpointsProtocol=/i.test(s)) {
    return `DefaultEndpointsProtocol=${s}`;
  }
  return s;
}

function getContainerName(containerEnv: string): string {
  if (
    containerEnv.startsWith("https://") &&
    containerEnv.includes(".blob.core.windows.net/")
  ) {
    const path =
      containerEnv.split(".blob.core.windows.net/")[1]?.split("?")[0] ?? "";
    return path.replace(/\/$/, "").split("/")[0] ?? containerEnv;
  }
  return containerEnv;
}

async function getLatestBlobNameByPrefix(
  containerClient: ReturnType<BlobServiceClient["getContainerClient"]>,
  prefix: string,
): Promise<string | null> {
  const blobs: { name: string; lastModified: Date }[] = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    const lastModified = blob.properties.lastModified;
    if (lastModified) {
      blobs.push({ name: blob.name, lastModified });
    }
  }
  if (blobs.length === 0) return null;
  blobs.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  const latest = blobs[0];
  return latest ? latest.name : null;
}

export async function getOnboardingProducts(): Promise<{
  data: OnboardingProduct[] | null;
  error: string | null;
}> {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    console.error(
      "getOnboardingProducts: configurare FE_SMCR_AZURE_STORAGE_CONNECTION_STRING + CONTAINER + ONBOARDING_PRODUCTS_BLOB, oppure ONBOARDING_PRODUCTS_BLOB come URL completo del blob",
    );
    return {
      data: null,
      error: "Configurazione storage non disponibile.",
    };
  }

  try {
    const connectionString = normalizeConnectionString(
      AZURE_STORAGE_CONNECTION_STRING!,
    );
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerName = getContainerName(AZURE_STORAGE_CONTAINER);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    if (!AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX) {
      return {
        data: null,
        error: "Nessun prefisso per i prodotti onboarding configurato.",
      };
    }
    const latestName = await getLatestBlobNameByPrefix(
      containerClient,
      AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX,
    );
    if (!latestName) {
      console.error(
        "getOnboardingProducts: nessun blob trovato con prefisso",
        AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX,
      );
      return {
        data: null,
        error: "Nessun file prodotti onboarding trovato nello storage.",
      };
    }
    const blobClient = containerClient.getBlobClient(latestName);
    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      console.error("getOnboardingProducts: blob senza contenuto");
      return {
        data: null,
        error: "Si è verificato un errore nel caricamento dei prodotti.",
      };
    }

    const buffer = await streamToBuffer(
      downloadResponse.readableStreamBody as Readable,
    );

    const raw = JSON.parse(buffer.toString("utf-8")) as unknown;
    const parsed = onboardingProductsSchema.parse(raw);
    return { data: parsed, error: null };
  } catch (error) {
    console.error("getOnboardingProducts: Azure Storage / parse error", error);
    return {
      data: null,
      error: "Si è verificato un errore nel caricamento dei prodotti.",
    };
  }
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
