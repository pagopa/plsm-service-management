"use server";

import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";

import { logServerError } from "@/lib/logger/logger.server.helpers";
import { serverEnv } from "@/config/env";

const IO_API_BASE =
  "https://api.io.italia.it/operation/auth/profile/api/v1/profiles";

const CF_RE = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;

/** Profilo IO (call #1 e singolo elemento di `items` nella call #2). */
const ioProfileSchema = z.object({
  accepted_tos_version: z.number().nullish(),
  email: z.string().nullish(),
  is_email_already_taken: z.boolean().nullish(),
  is_email_enabled: z.boolean().nullish(),
  is_email_validated: z.boolean().nullish(),
  is_inbox_enabled: z.boolean().nullish(),
  is_test_profile: z.boolean().nullish(),
  is_webhook_enabled: z.boolean().nullish(),
  last_app_version: z.string().nullish(),
  preferred_languages: z.array(z.string()).nullish(),
  push_notifications_content_type: z.string().nullish(),
  reminder_status: z.string().nullish(),
  service_preferences_settings: z
    .object({
      mode: z.string().nullish(),
      version: z.number().nullish(),
    })
    .nullish(),
  version: z.number(),
});

const ioVersionsSchema = z.object({
  items: z.array(ioProfileSchema),
  page: z.number().nullish(),
  page_size: z.number().nullish(),
  has_more: z.boolean().nullish(),
});

const ioServicePreferencesSchema = z.object({
  can_access_message_read_status: z.boolean().nullish(),
  is_email_enabled: z.boolean().nullish(),
  is_inbox_enabled: z.boolean().nullish(),
  is_webhook_enabled: z.boolean().nullish(),
  settings_version: z.number().nullish(),
});

export type IoProfile = z.infer<typeof ioProfileSchema>;
export type IoVersions = z.infer<typeof ioVersionsSchema>;
export type IoServicePreferences = z.infer<typeof ioServicePreferencesSchema>;

type IoResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

function ioHeaders() {
  return {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": serverEnv.FE_SMCR_API_KEY_UTENTI_IO as string,
  };
}

function normalizeCf(input: string) {
  return input.trim().toUpperCase();
}

/**
 * Call #1 — Profilo attivo.
 * GET /profiles/{cf}
 */
export async function getIoProfile(
  fiscalCode: string,
): Promise<IoResult<IoProfile>> {
  const cf = normalizeCf(fiscalCode);
  if (!CF_RE.test(cf)) {
    return { data: null, error: "Formato codice fiscale non valido." };
  }

  const { data, error } = await betterFetch(
    `${IO_API_BASE}/${encodeURIComponent(cf)}`,
    {
      method: "GET",
      output: ioProfileSchema,
      headers: ioHeaders(),
    },
  );

  if (error || !data) {
    if (error?.status === 404) {
      return { data: null, error: "Nessun profilo IO trovato per il codice fiscale inserito." };
    }
    logServerError(error, "getIoProfile - fetch error", { cf });
    return { data: null, error: "Errore nel recupero del profilo IO." };
  }

  return { data, error: null };
}

/**
 * Call #2 — Versioni storiche del profilo.
 * GET /profiles/{cf}/versions?page={page}&page_size={pageSize}
 */
export async function getIoProfileVersions(
  fiscalCode: string,
  page = 1,
  pageSize = 100,
): Promise<IoResult<IoVersions>> {
  const cf = normalizeCf(fiscalCode);
  if (!CF_RE.test(cf)) {
    return { data: null, error: "Formato codice fiscale non valido." };
  }

  const { data, error } = await betterFetch(
    `${IO_API_BASE}/${encodeURIComponent(cf)}/versions?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      output: ioVersionsSchema,
      headers: ioHeaders(),
    },
  );

  if (error || !data) {
    logServerError(error, "getIoProfileVersions - fetch error", { cf, page });
    return { data: null, error: "Errore nel recupero delle versioni del profilo." };
  }

  return { data, error: null };
}

/**
 * Call #3 — Preferenze per uno specifico servizio.
 * GET /profiles/{cf}/services/{serviceId}/preferences
 */
export async function getIoServicePreferences(
  fiscalCode: string,
  serviceId: string,
): Promise<IoResult<IoServicePreferences>> {
  const cf = normalizeCf(fiscalCode);
  if (!CF_RE.test(cf)) {
    return { data: null, error: "Formato codice fiscale non valido." };
  }

  const svc = serviceId.trim().toUpperCase();
  if (svc.length < 10) {
    return { data: null, error: "Inserisci un identificativo servizio valido." };
  }

  const { data, error } = await betterFetch(
    `${IO_API_BASE}/${encodeURIComponent(cf)}/services/${encodeURIComponent(svc)}/preferences`,
    {
      method: "GET",
      output: ioServicePreferencesSchema,
      headers: ioHeaders(),
    },
  );

  if (error || !data) {
    if (error?.status === 404) {
      return {
        data: null,
        error: "Nessuna preferenza trovata per il servizio indicato.",
      };
    }
    logServerError(error, "getIoServicePreferences - fetch error", {
      cf,
      svc,
    });
    return { data: null, error: "Errore nel recupero delle preferenze servizio." };
  }

  return { data, error: null };
}
