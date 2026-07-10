"use server";

import { randomUUID } from "crypto";
import { format as formatDate } from "date-fns";
import { it } from "date-fns/locale";
import z from "zod";
import { PRODUCT_MAP } from "../types/product";
import logger from "@/lib/logger/logger.server";
import { getCrmErrorMessage } from "@/lib/crm-error-messages";
import { serverEnv } from "@/config/env";
import { tipologiaReferenteValues } from "@/components/call-management/crm-form-schema";

const formatItalianDateTime = (value: string) => {
  const isoMatch =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);

  if (isoMatch) {
    const [, year, month, day, hours, minutes] = isoMatch;
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDate(parsed, "dd/MM/yyyy HH:mm", { locale: it });
  }

  return value;
};

const sendToSlackSchema = z.object({
  name: z.string(),
  product: z.string(),
  date: z.string(),
  members: z.string(),
  link: z.url(),
  target: z.enum(["test", "prod"]),
});

type SendToSlackInput = z.infer<typeof sendToSlackSchema>;

export type SendToSlackFormState = {
  fields: Partial<SendToSlackInput>;
  errors?: Partial<SendToSlackInput> & { root?: string };
  target?: "test" | "prod";
  submittedAt?: number;
};

export async function sendToSlackAction(
  prevState: SendToSlackFormState,
  formData: FormData,
): Promise<SendToSlackFormState> {
  const inputEntries = Object.fromEntries(formData.entries());
  const validation = sendToSlackSchema.safeParse(inputEntries);

  if (!validation.success) {
    const errors: Record<string, string> = {};

    for (const issue of validation.error.issues) {
      if (issue.path.length > 0) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
    }

    const sanitizedFields: SendToSlackFormState["fields"] = {
      name: String(inputEntries.name ?? ""),
      product: String(inputEntries.product ?? ""),
      date: String(inputEntries.date ?? ""),
      members: String(inputEntries.members ?? ""),
      link: String(inputEntries.link ?? ""),
      target: (inputEntries.target as "test" | "prod") ?? "test",
    };

    logger.warn(
      {
        info: {
          event: "call-management.send-to-slack.validation-failed",
          metadata: {
            target: sanitizedFields.target ?? prevState.target ?? "test",
            invalidFields: Object.keys(errors),
          },
        },
      },
      "sendToSlackAction validation failed",
    );

    return {
      fields: sanitizedFields,
      errors,
      target: sanitizedFields.target ?? prevState.target,
      submittedAt: Date.now(),
    };
  }

  const webhooks = {
    test: serverEnv.FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST,
    prod: serverEnv.FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD,
  };
  const webhook = webhooks[validation.data.target];

  if (!webhook) {
    logger.error(
      {
        info: {
          event: "call-management.send-to-slack.missing-webhook",
          metadata: { target: validation.data.target },
        },
      },
      "sendToSlackAction missing webhook env",
    );
    return {
      fields: validation.data,
      errors: { root: "Errore imprevisto durante l'invio del messaggio." },
      target: validation.data.target,
      submittedAt: Date.now(),
    };
  }

  const membersArray = validation.data.members.split(",").map((m) => m.trim());
  const membersText = membersArray.map((m) => `• ${m}`).join("\n");
  const dateTimeText = formatItalianDateTime(validation.data.date);

  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:mega: *${validation.data.name}* :mega:`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Prodotto:*\n${PRODUCT_MAP[validation.data.product] || validation.data.product}`,
          },
          {
            type: "mrkdwn",
            text: `*Data e Ora 📅:*\n${dateTimeText}`,
          },
          {
            type: "mrkdwn",
            text: `*Partecipanti del Team SM:*\n${membersText}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Diario delle call",
            },
            url: validation.data.link,
            style: "primary",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Service Management",
            },
            url: "https://pagopa.atlassian.net/wiki/spaces/ISM/overview",
            style: "danger",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "IO Service Management :rocket:",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: ":clap: Service Management transforms customer needs into value-driven solutions.",
          },
        ],
      },
    ],
  };

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  if (!response.ok) {
    const body = await response.json();
    logger.error(
      {
        request: {
          method: "POST",
          path: "slack-webhook",
          statusCode: response.status,
        },
        error: {
          name: "SlackWebhookError",
          message: typeof body === "string" ? body : JSON.stringify(body ?? {}),
        },
        info: {
          event: "call-management.send-to-slack.failed",
          metadata: { target: validation.data.target },
        },
      },
      "sendToSlackAction failed to send Slack message",
    );

    return {
      fields: validation.data,
      errors: { root: "Errore imprevisto durante l'invio del messaggio." },
      target: validation.data.target,
      submittedAt: Date.now(),
    };
  }

  logger.info(
    {
      info: {
        event: "call-management.send-to-slack.success",
        metadata: {
          target: validation.data.target,
          product: validation.data.product,
          membersCount: membersArray.length,
        },
      },
    },
    "sendToSlackAction sent Slack message",
  );

  return {
    fields: {
      name: validation.data.name,
      product: validation.data.product,
      date: validation.data.date,
      members: validation.data.members,
      link: validation.data.link,
      target: validation.data.target,
    },
    target: validation.data.target,
    submittedAt: Date.now(),
  };
}

// --- CRM Meeting (OpenAPI sm-crm-fn POST /meetings) ---

export type TipologiaReferente = (typeof tipologiaReferenteValues)[number];

export type CreateMeetingPartecipante = {
  email?: string;
  nome?: string;
  cognome?: string;
  tipologiaReferente?: TipologiaReferente;
};

export type DynamicsCrmEnvironment = "UAT" | "PROD";

export type CreateMeetingInput = {
  institutionIdSelfcare: string;
  productIdSelfcare: string;
  partecipanti: CreateMeetingPartecipante[];
  subject: string;
  scheduledstart: string;
  scheduledend: string;
  location?: string;
  description?: string;
  link?: string;
  category?: string;
  dataProssimoContatto?: string;
  oggettoDelContatto?: number;
  enableCreateContact?: boolean;
  enableGrantAccess?: boolean;
  dryRun?: boolean;
  dynamicsEnvironment?: DynamicsCrmEnvironment;
};

export type CreateMeetingResult =
  | { success: true; activityId?: string; message?: string }
  | { success: false; error: string };

type CreateMeetingResponse = {
  activityId?: string;
  message?: string;
  error?: unknown;
};

const truncateLogValue = (value: string, maxLength = 2000) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const stringifyLogValue = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value ?? {});
  } catch {
    return String(value);
  }
};

export async function createMeetingAction(
  input: CreateMeetingInput,
): Promise<CreateMeetingResult> {
  const operationId = randomUUID();
  logger.info(
    {
      info: {
        event: "call-management.create-meeting",
        metadata: { operationId, ...input },
      },
    },
    "Create meeting input received",
  );
  const baseUrl = serverEnv.FE_SMCR_CRM_API_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    logger.warn(
      {
        info: {
          event: "call-management.create-meeting.missing-env",
          metadata: { operationId },
        },
      },
      "FE_SMCR_CRM_API_URL not set",
    );
    return { success: false, error: "API CRM non configurata." };
  }

  const url = `${baseUrl}/meetings`;
  const dynamicsEnv: DynamicsCrmEnvironment =
    input.dynamicsEnvironment ?? "PROD";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-dynamics-environment": dynamicsEnv,
  };
  if (serverEnv.FE_SMCR_CRM_API_KEY) {
    headers["x-functions-key"] = serverEnv.FE_SMCR_CRM_API_KEY;
  }

  const description = [
    input.description,
    input.link && `Link al diario: ${input.link}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const body = {
    institutionIdSelfcare: input.institutionIdSelfcare,
    productIdSelfcare: input.productIdSelfcare,
    partecipanti: input.partecipanti,
    subject: input.subject,
    scheduledstart: input.scheduledstart,
    scheduledend: input.scheduledend,
    ...(input.location !== undefined && input.location !== ""
      ? { location: input.location }
      : {}),
    ...(description !== "" ? { description } : {}),
    ...(input.category !== undefined && input.category !== ""
      ? { categoria: input.category }
      : {}),
    ...(input.dataProssimoContatto !== undefined &&
    input.dataProssimoContatto !== ""
      ? { dataProssimoContatto: input.dataProssimoContatto }
      : {}),
    ...(input.oggettoDelContatto !== undefined
      ? { oggettoDelContatto: input.oggettoDelContatto }
      : {}),
    ...(input.enableCreateContact !== undefined
      ? { enableCreateContact: input.enableCreateContact }
      : {}),
    ...(input.enableGrantAccess !== undefined
      ? { enableGrantAccess: input.enableGrantAccess }
      : {}),
    ...(input.dryRun !== undefined ? { dryRun: input.dryRun } : {}),
  };

  const loggedPayload = {
    institutionIdSelfcare: body.institutionIdSelfcare,
    productIdSelfcare: body.productIdSelfcare,
    partecipanti: body.partecipanti.map((partecipante) => ({
      tipologiaReferente: partecipante.tipologiaReferente,
      hasEmail: Boolean(partecipante.email),
    })),
    partecipantiCount: body.partecipanti.length,
    subject: body.subject,
    scheduledstart: body.scheduledstart,
    scheduledend: body.scheduledend,
    location: body.location,
    hasDescription: Boolean(description),
    descriptionLength: description.length,
    hasLink: Boolean(input.link),
    categoria: body.categoria,
    dataProssimoContatto: body.dataProssimoContatto,
    oggettoDelContatto: body.oggettoDelContatto,
    enableCreateContact: body.enableCreateContact,
    enableGrantAccess: body.enableGrantAccess,
    dryRun: body.dryRun,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const responseText = await res.text().catch(() => "");
    let data: CreateMeetingResponse = {};

    try {
      data = responseText
        ? (JSON.parse(responseText) as CreateMeetingResponse)
        : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message =
        typeof data.message === "string"
          ? data.message
          : typeof data.error === "string"
            ? data.error
            : data.error
              ? stringifyLogValue(data.error)
              : responseText
                ? truncateLogValue(responseText)
                : `HTTP ${res.status}`;
      logger.error(
        {
          request: { method: "POST", path: url, statusCode: res.status },
          error: {
            message,
            responseBodyPreview: truncateLogValue(responseText),
          },
          info: {
            event: "call-management.create-meeting.failed",
            metadata: {
              operationId,
              dynamicsEnvironment: dynamicsEnv,
              payload: loggedPayload,
            },
          },
        },
        "createMeetingAction failed",
      );
      const neutralCode =
        data.error &&
        typeof data.error === "object" &&
        data.error !== null &&
        "code" in data.error &&
        typeof (data.error as { code?: unknown }).code === "string"
          ? (data.error as { code: string }).code
          : undefined;

      return {
        success: false,
        error: neutralCode ? getCrmErrorMessage(neutralCode) : message,
      };
    }

    logger.info(
      {
        info: {
          event: "call-management.create-meeting.success",
          metadata: {
            activityId: data?.activityId,
            dynamicsEnvironment: dynamicsEnv,
            operationId,
          },
        },
      },
      "createMeetingAction success",
    );
    return {
      success: true,
      activityId: data?.activityId,
      message: data?.message ?? "Appuntamento creato con successo",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Errore di connessione al CRM.";
    logger.error(
      {
        error: { name: "CreateMeetingError", message },
        info: {
          event: "call-management.create-meeting.error",
          metadata: {
            operationId,
            dynamicsEnvironment: dynamicsEnv,
            payload: loggedPayload,
          },
        },
      },
      "createMeetingAction error",
    );
    return { success: false, error: message };
  }
}
