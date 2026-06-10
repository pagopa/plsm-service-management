import { randomUUID } from "crypto";
import pino from "pino";
import pinoPretty from "pino-pretty";
import { serverEnv } from "@/config/env";

const streams: pino.StreamEntry[] = [
  { stream: pinoPretty({ colorize: true, translateTime: "HH:MM:ss" }) },
];

const remoteStream = {
  write: async (input: string) => {
    try {
      const log = JSON.parse(input);
      const endpoint = serverEnv.FE_SMCR_LOGS_ENDPOINT;

      if (!endpoint) {
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        process.stderr.write(
          `error sending log: ${response.status} ${response.statusText}\n`,
        );
      }
    } catch (error) {
      process.stderr.write(`error sending log: ${String(error)}\n`);
    }
  },
};

if (serverEnv.FE_SMCR_LOGS_ENDPOINT) {
  streams.push({ stream: remoteStream });
}

const logger = pino(
  {
    level: (serverEnv.FE_SMCR_LOG_LEVEL as string) || "info",
    messageKey: "message",
    base: {
      service: "SMCR",
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },

      log(object) {
        return {
          ...object,
          requestId: object.requestId ?? randomUUID(),
        };
      },
    },
  },
  pino.multistream(streams),
);

export default logger;
