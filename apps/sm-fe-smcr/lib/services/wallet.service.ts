"use server";

import { z } from "zod";

import logger from "@/lib/logger/logger.server";
import { serverEnv } from "@/config/env";
import { downloadLatestAzureBlobByPrefix } from "@/lib/services/azure-blob.storage";

const walletRowSchema = z.object({
  id: z.string(),
  producerid: z.string(),
  nomeEnte: z.string(),
  product: z.string(),
  name: z.string(),
  description: z.string(),
  mode: z.string(),
  technology: z.string(),
  state: z.string(),
  createdat: z.string(),
  descriptorid: z.string().optional(),
});

const walletPayloadSchema = z.array(walletRowSchema);

export type WalletRow = z.infer<typeof walletRowSchema>;

export async function getWalletReport(): Promise<{
  data: WalletRow[] | null;
  error: string | null;
}> {
  const connectionString = serverEnv.FE_SMCR_AZURE_STORAGE_CONNECTION_STRING;
  const containerNameOrUrl = serverEnv.FE_SMCR_AZURE_STORAGE_CONTAINER_WALLET;
  const blobPrefix = serverEnv.FE_SMCR_AZURE_STORAGE_WALLET_BLOB_PREFIX;

  if (!connectionString) {
    logger.warn(
      {
        info: {
          event: "wallet.config_missing",
          actor: "smcr-ui",
          subject: "getWalletReport",
          metadata: {
            hint: "FE_SMCR_AZURE_STORAGE_CONNECTION_STRING + FE_SMCR_AZURE_STORAGE_CONTAINER_WALLET + FE_SMCR_AZURE_STORAGE_WALLET_BLOB_PREFIX",
          },
        },
      },
      "Configurazione storage non disponibile per getWalletReport",
    );
    return {
      data: null,
      error: "Configurazione storage non disponibile.",
    };
  }

  if (!containerNameOrUrl?.trim()) {
    return {
      data: null,
      error:
        "Container storage Wallet non configurato (FE_SMCR_AZURE_STORAGE_CONTAINER_WALLET).",
    };
  }

  if (!blobPrefix?.trim()) {
    return {
      data: null,
      error:
        "Prefisso blob Wallet non configurato (FE_SMCR_AZURE_STORAGE_WALLET_BLOB_PREFIX).",
    };
  }

  try {
    const downloaded = await downloadLatestAzureBlobByPrefix({
      connectionString,
      containerNameOrUrl: containerNameOrUrl.trim(),
      blobPrefix: blobPrefix.trim(),
    });
    if (!downloaded) {
      logger.warn(
        {
          info: {
            event: "wallet.no_blob",
            actor: "smcr-ui",
            subject: "getWalletReport",
            metadata: { prefix: blobPrefix.trim() },
          },
        },
        "Nessun blob trovato per il report wallet",
      );
      return {
        data: null,
        error: "Nessun file report trovato nello storage.",
      };
    }
    const content = downloaded.buffer.toString("utf-8").trim();
    if (!content) {
      logger.warn(
        {
          info: {
            event: "wallet.empty_blob",
            actor: "smcr-ui",
            subject: "getWalletReport",
            metadata: { blobName: downloaded.blobName },
          },
        },
        "Blob report wallet senza contenuto",
      );
      return {
        data: null,
        error: "Il file report nello storage è vuoto o non leggibile.",
      };
    }
    const raw = JSON.parse(content) as unknown;
    const parsed = walletPayloadSchema.parse(raw);
    const sorted = [...parsed].sort((a, b) =>
      b.createdat.localeCompare(a.createdat),
    );
    return { data: sorted, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name === "AzureBlobEmptyBody") {
      logger.error(
        {
          info: {
            event: "wallet.empty_blob",
            actor: "smcr-ui",
            subject: "getWalletReport",
            metadata: {},
          },
        },
        "Blob report wallet senza contenuto",
      );
      return {
        data: null,
        error: "Il file report nello storage è vuoto o non leggibile.",
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
          event: "wallet.fetch_error",
          actor: "smcr-ui",
          subject: "getWalletReport",
          metadata: {},
        },
      },
      "getWalletReport: Azure Storage / parse error",
    );
    return {
      data: null,
      error: "Si è verificato un errore nel caricamento del report.",
    };
  }
}
