import pino from "pino";
import pinoPretty from "pino-pretty";

const logger = pino(
  {
    base: {
      service: "SMCR",
    },
  },
  pinoPretty({
    colorize: true,
    translateTime: "HH:MM:ss",
  }),
);

export default logger;
