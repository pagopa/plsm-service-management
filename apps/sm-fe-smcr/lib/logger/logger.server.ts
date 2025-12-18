import pino from "pino";
import pinoPretty from "pino-pretty";

const logger = pino(
  pinoPretty({
    colorize: true,
    translateTime: "HH:MM:ss",
  }),
);

export default logger;
