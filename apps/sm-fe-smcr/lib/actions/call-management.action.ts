"use server";

import z from "zod";
import { PRODUCT_MAP } from "../types/product";

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

    return {
      fields: sanitizedFields,
      errors,
      target: sanitizedFields.target ?? prevState.target,
      submittedAt: Date.now(),
    };
  }

  const webhooks = {
    test: process.env.SLACK_CALL_MANAGEMENT_HOOK_TEST,
    prod: process.env.SLACK_CALL_MANAGEMENT_HOOK_PROD,
  };
  const webhook = webhooks[validation.data.target];

  if (!webhook) {
    console.error(
      "Errore durante l'invio del messaggio, env SLACK_CALL_MANAGEMENT_HOOK mancante.",
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
            text: `*Data e Ora 📅:*\n${validation.data.date}`,
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
    console.error(
      "Errore durante l'invio del messaggio, status:",
      response.status,
      body,
    );

    return {
      fields: validation.data,
      errors: { root: "Errore imprevisto durante l'invio del messaggio." },
      target: validation.data.target,
      submittedAt: Date.now(),
    };
  }

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
