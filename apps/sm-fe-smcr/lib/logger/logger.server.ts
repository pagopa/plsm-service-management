import dayjs from "dayjs";
import pino from "pino";
import pinoPretty from "pino-pretty";

const remoteStream = {
  write: async (input: string) => {
    try {
      const log = JSON.parse(input);
      console.log("LOG", log);

      await fetch("http://localhost:3000/api/monitoring/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: dayjs(log.time).toISOString(),
          level: "INFO",
          service: log.service,
          message: log.msg,
        }),
      });
    } catch (error) {
      console.error("error sending log:", error);
    }
  },
};

const logger = pino(
  {
    base: {
      service: "SMCR",
    },
  },
  // Combina pretty print in console + invio remoto
  pino.multistream([
    { stream: pinoPretty({ colorize: true, translateTime: "HH:MM:ss" }) },
    { stream: remoteStream },
  ]),
);

export default logger;
