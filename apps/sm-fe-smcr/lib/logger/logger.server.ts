import { randomUUID } from "crypto";
import pino from "pino";
import pinoPretty from "pino-pretty";

const remoteStream = {
  write: async (input: string) => {
    try {
      const log = JSON.parse(input);
      console.log("LOG", log);

      await fetch(process.env.FE_SMCR_LOGS_ENDPOINT as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.error("error sending log:", error);
    }
  },
};

const logger = pino(
  {
    level: (process.env.FE_SMCR_LOG_LEVEL as string) || "info",
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
  // Combina pretty print in console + invio remoto
  pino.multistream([
    { stream: pinoPretty({ colorize: true, translateTime: "HH:MM:ss" }) },
    { stream: remoteStream },
  ]),
);

export default logger;
