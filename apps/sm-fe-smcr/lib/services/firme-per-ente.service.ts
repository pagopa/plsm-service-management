"use server";

import { z } from "zod";

import logger from "@/lib/logger/logger.server";
import { serverEnv } from "@/config/env";
import { downloadLatestAzureBlobByPrefix } from "@/lib/services/azure-blob.storage";

const firmaPerEnteRowSchema = z.object({
  internalinstitutionid: z.string(),
  description: z.string(),
  firme_rejected: z.number(),
  firme_cancelled: z.number(),
  firme_signed: z.number(),
});

const firmePerEntePayloadSchema = z.array(firmaPerEnteRowSchema);

export type FirmaPerEnteRow = z.infer<typeof firmaPerEnteRowSchema>;

export async function getFirmePerEnteReport(): Promise<{
  data: FirmaPerEnteRow[] | null;
  error: string | null;
}> {
  const connectionString = serverEnv.FE_SMCR_AZURE_STORAGE_CONNECTION_STRING;
  const containerNameOrUrl =
    serverEnv.FE_SMCR_AZURE_STORAGE_CONTAINER_FIRMA_CON_IO;
  const blobPrefix = serverEnv.FE_SMCR_AZURE_STORAGE_FIRMA_CON_IO_BLOB_PREFIX;

  if (!connectionString) {
    logger.warn(
      {
        info: {
          event: "firme_per_ente.config_missing",
          actor: "smcr-ui",
          subject: "getFirmePerEnteReport",
          metadata: {
            hint: "FE_SMCR_AZURE_STORAGE_CONNECTION_STRING + FE_SMCR_AZURE_STORAGE_CONTAINER_FIRMA_CON_IO + FE_SMCR_AZURE_STORAGE_FIRMA_CON_IO_BLOB_PREFIX",
          },
        },
      },
      "Configurazione storage non disponibile per getFirmePerEnteReport",
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
        "Container storage Firma con IO non configurato (FE_SMCR_AZURE_STORAGE_CONTAINER_FIRMA_CON_IO).",
    };
  }

  if (!blobPrefix?.trim()) {
    return {
      data: null,
      error:
        "Prefisso blob Firma con IO non configurato (FE_SMCR_AZURE_STORAGE_FIRMA_CON_IO_BLOB_PREFIX).",
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
            event: "firme_per_ente.no_blob",
            actor: "smcr-ui",
            subject: "getFirmePerEnteReport",
            metadata: { prefix: blobPrefix.trim() },
          },
        },
        "Nessun blob trovato per il report firme per ente",
      );
      return {
        data: null,
        error: "Nessun file report trovato nello storage.",
      };
    }

    const raw = JSON.parse(downloaded.buffer.toString("utf-8")) as unknown;
    const parsed = firmePerEntePayloadSchema.parse(raw);
    const sorted = [...parsed].sort((a, b) => b.firme_signed - a.firme_signed);
    return { data: sorted, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name === "AzureBlobEmptyBody") {
      logger.error(
        {
          info: {
            event: "firme_per_ente.empty_blob",
            actor: "smcr-ui",
            subject: "getFirmePerEnteReport",
            metadata: {},
          },
        },
        "Blob report firme per ente senza contenuto",
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
          event: "firme_per_ente.fetch_error",
          actor: "smcr-ui",
          subject: "getFirmePerEnteReport",
          metadata: {},
        },
      },
      "getFirmePerEnteReport: Azure Storage / parse error",
    );
    return {
      data: null,
      error: "Si è verificato un errore nel caricamento del report.",
    };
  }
}
