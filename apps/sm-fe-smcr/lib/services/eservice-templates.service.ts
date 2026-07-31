"use server";

import { z } from "zod";

import { serverEnv } from "@/config/env";
import logger from "@/lib/logger/logger.server";
import { pdndFetch } from "@/lib/pdnd";

const eserviceTemplateSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  name: z.string(),
  intendedTarget: z.string().default(""),
  description: z.string().default(""),
  technology: z.string().default(""),
  mode: z.string().default(""),
  isSignalHubEnabled: z.boolean().default(false),
  personalData: z.boolean().default(false),
});

const eserviceTemplatesPageSchema = z.object({
  results: z.array(eserviceTemplateSchema),
  pagination: z.object({
    offset: z.number(),
    limit: z.number(),
    totalCount: z.number(),
  }),
});

export type EserviceTemplate = z.infer<typeof eserviceTemplateSchema>;

const PAGE_SIZE = 50;
const MAX_PAGES = 20;

export async function getEserviceTemplates(): Promise<{
  data: EserviceTemplate[] | null;
  error: string | null;
}> {
  const missingConfig = [
    "PDND_API_BASE_URL",
    "PDND_AUTH_TOKEN_URL",
    "PDND_CLIENT_ID",
  ].filter((key) => !serverEnv[key as keyof typeof serverEnv]?.trim());

  if (missingConfig.length > 0) {
    logger.warn(
      {
        info: {
          event: "eservice_templates.config_missing",
          actor: "smcr-ui",
          subject: "getEserviceTemplates",
          metadata: { missing: missingConfig.join(", ") },
        },
      },
      "Configurazione PDND non disponibile per getEserviceTemplates",
    );
    return {
      data: null,
      error: "Configurazione PDND non disponibile.",
    };
  }

  try {
    const templates: EserviceTemplate[] = [];
    let offset = 0;
    let totalCount = 0;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      const response = await pdndFetch(
        `/${serverEnv.PDND_API_VERSION}/eserviceTemplates?${params.toString()}`,
      );

      if (!response.ok) {
        const body = await response.text();
        logger.error(
          {
            info: {
              event: "eservice_templates.request_failed",
              actor: "smcr-ui",
              subject: "getEserviceTemplates",
              metadata: { status: response.status, offset, body },
            },
          },
          "Richiesta PDND eserviceTemplates fallita",
        );
        return {
          data: null,
          error: "Impossibile recuperare i template e-service da PDND.",
        };
      }

      const parsedPage = eserviceTemplatesPageSchema.parse(
        await response.json(),
      );
      templates.push(...parsedPage.results);
      totalCount = parsedPage.pagination.totalCount;
      offset += parsedPage.pagination.limit || PAGE_SIZE;

      if (parsedPage.results.length === 0 || templates.length >= totalCount) {
        break;
      }
    }

    if (templates.length < totalCount) {
      logger.warn(
        {
          info: {
            event: "eservice_templates.truncated",
            actor: "smcr-ui",
            subject: "getEserviceTemplates",
            metadata: { fetched: templates.length, totalCount },
          },
        },
        "Elenco template e-service troncato al limite di pagine",
      );
    }

    const sorted = [...templates].sort((a, b) =>
      a.name.localeCompare(b.name, "it"),
    );
    return { data: sorted, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        info: {
          event: "eservice_templates.fetch_error",
          actor: "smcr-ui",
          subject: "getEserviceTemplates",
          metadata: {},
        },
      },
      "getEserviceTemplates: PDND / parse error",
    );
    return {
      data: null,
      error:
        "Si è verificato un errore nel caricamento dei template e-service.",
    };
  }
}
