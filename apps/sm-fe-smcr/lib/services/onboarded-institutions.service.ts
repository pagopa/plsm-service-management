import "server-only";

import { z } from "zod";

import { serverEnv } from "@/config/env";
import { toRomeDay } from "@/features/onboarding/onboarded-institutions/filters";
import logger from "@/lib/logger/logger.server";
import { toLogError } from "@/lib/logger/logger.utils";
import {
  downloadAzureBlobAsBuffer,
  getAzureBlobContainerClient,
} from "@/lib/services/azure-blob.storage";

const BLOB_NAME = "Estrazione_All_Onboardings.json";

const reportRowSchema = z.object({
  prodotto: z.string(),
  id_ente: z.string(),
  nome_ente: z.string(),
  data_attivazione: z.iso.datetime({ offset: true }),
});

const reportSchema = z.array(reportRowSchema);

export type OnboardedInstitution = {
  giorno_attivazione: string;
  prodotto: string;
  id_ente: string;
  nome_ente: string;
};

export async function getOnboardedInstitutions(): Promise<{
  data: OnboardedInstitution[] | null;
  error: string | null;
}> {
  const connectionString = serverEnv.FE_SMCR_AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    logger.warn(
      {
        info: {
          event: "onboarded_institutions.config_missing",
          metadata: {
            hint: "FE_SMCR_AZURE_STORAGE_CONNECTION_STRING + FE_SMCR_AZURE_STORAGE_CONTAINER",
          },
        },
      },
      "Configurazione storage non disponibile per getOnboardedInstitutions",
    );
    return { data: null, error: "Configurazione storage non disponibile." };
  }

  try {
    const containerClient = getAzureBlobContainerClient(
      connectionString,
      serverEnv.FE_SMCR_AZURE_STORAGE_CONTAINER,
    );
    const buffer = await downloadAzureBlobAsBuffer(containerClient, BLOB_NAME);

    const content = buffer.toString("utf-8").trim();
    if (!content) {
      const emptyBlobError = new Error("Blob has no content");
      emptyBlobError.name = "AzureBlobEmptyBody";
      throw emptyBlobError;
    }

    const raw = JSON.parse(content) as unknown;
    const parsed = reportSchema.parse(raw);

    const data = parsed
      .map((row) => ({ row, time: Date.parse(row.data_attivazione) }))
      .sort((a, b) => b.time - a.time)
      .map(({ row, time }) => ({
        giorno_attivazione: toRomeDay(time),
        prodotto: row.prodotto,
        id_ente: row.id_ente,
        nome_ente: row.nome_ente,
      }));

    return { data, error: null };
  } catch (error) {
    const isNotFound =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 404;
    if (isNotFound) {
      logger.warn(
        {
          info: {
            event: "onboarded_institutions.no_blob",
            metadata: { blobName: BLOB_NAME },
          },
        },
        "Nessun blob trovato per il report enti onboardati",
      );
      return {
        data: null,
        error: "Nessun file report trovato nello storage.",
      };
    }

    const isEmptyBlob =
      error instanceof Error && error.name === "AzureBlobEmptyBody";
    logger.error(
      {
        error: toLogError(error),
        info: {
          event: isEmptyBlob
            ? "onboarded_institutions.empty_blob"
            : "onboarded_institutions.fetch_error",
          metadata: { blobName: BLOB_NAME },
        },
      },
      "getOnboardedInstitutions: Azure Storage / parse error",
    );
    return {
      data: null,
      error: isEmptyBlob
        ? "Il file report nello storage è vuoto o non leggibile."
        : "Si è verificato un errore nel caricamento del report.",
    };
  }
}
