"use server";

import z from "zod";
import { serverEnv } from "@/config/env";
import logger from "@/lib/logger/logger.server";

const reportErrorSchema = z.object({
  title: z
    .string("Il titolo è obbligatorio.")
    .trim()
    .min(3, "Inserisci almeno 3 caratteri.")
    .max(80, "Massimo 80 caratteri."),
  description: z
    .string("La descrizione è obbligatoria.")
    .trim()
    .min(10, "Inserisci almeno 10 caratteri.")
    .max(2000, "Massimo 2000 caratteri."),
});

type ReportErrorInput = z.infer<typeof reportErrorSchema>;

export type ReportErrorFormState = {
  fields: Partial<ReportErrorInput>;
  errors?: Partial<ReportErrorInput> & { root?: string };
};

export async function reportError(
  prevState: ReportErrorFormState,
  formData: FormData,
): Promise<ReportErrorFormState> {
  const input = Object.fromEntries(formData.entries());
  const validation = reportErrorSchema.safeParse(input);

  if (!validation.success) {
    const errors: Record<string, string> = {};

    for (const issue of validation.error.issues) {
      if (issue.path.length > 0) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
    }

    return { fields: input, errors };
  }

  const webhook = serverEnv.FE_SMCR_API_SLACK_REPORT_HOOK;
  if (!webhook) {
    logger.error(
      {
        info: { event: "report-error.missing-slack-webhook" },
      },
      "Errore durante l'invio della segnalazione, env FE_SMCR_API_SLACK_REPORT_HOOK mancante.",
    );
    return {
      fields: validation.data,
      errors: { root: "Errore imprevisto durante l'invio della segnalazione." },
    };
  }

  const payload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🐞 Nuova segnalazione utente" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Titolo:*\n${validation.data.title}` },
          {
            type: "mrkdwn",
            text: `*Descrizione:*\n${validation.data.description}`,
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
    logger.error(
      {
        info: {
          event: "report-error.slack-webhook-failed",
          metadata: { status: response.status },
        },
      },
      "Errore durante l'invio della segnalazione",
    );

    return {
      fields: validation.data,
      errors: { root: "Errore imprevisto durante l'invio della segnalazione." },
    };
  }

  return { fields: { ...input } };
}
