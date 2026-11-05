import "server-only";

import { serverEnv } from "@/config/env";
import type { Log } from "@/lib/services/logs.service";

const SLACK_TIMEOUT_MS = 5000;
const SLACK_TEXT_LIMIT = 3000;

export async function notifyFatalLog(log: Log): Promise<void> {
  const webhook = serverEnv.FE_SMCR_API_SLACK_FATAL_LOGS_HOOK?.trim();

  if (
    log.level !== "FATAL" ||
    process.env.NODE_ENV !== "production" ||
    !webhook
  ) {
    return;
  }

  try {
    const payload = {
      text: `Log FATAL in produzione (${log.service})`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🚨 Log FATAL" },
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: [
              "Ambiente: produzione",
              `Servizio: ${log.service}`,
              `Data: ${log.timestamp}`,
              `ID log: ${log.id}`,
              `ID richiesta: ${log.requestId ?? "Non disponibile"}`,
            ]
              .join("\n")
              .slice(0, SLACK_TEXT_LIMIT),
          },
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: log.message.slice(0, SLACK_TEXT_LIMIT) || "(messaggio vuoto)",
          },
        },
      ],
    };

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });

    if (!response.ok) {
      process.stderr.write(
        `notifyFatalLog - Slack returned status ${response.status}\n`,
      );
    }
  } catch {
    // Do not use the application logger or expose webhook URLs in diagnostics.
    process.stderr.write("notifyFatalLog - Slack request failed or timed out\n");
  }
}
