import logger from "@/lib/logger/logger.server";
import {
  compactLogFields,
  toLogError,
  toLogMetadata,
} from "@/lib/logger/logger.utils";

export function logServerError(
  error: unknown,
  message: string,
  metadata?: unknown,
) {
  logger.error(
    {
      error: toLogError(error),
      info: compactLogFields({ metadata: toLogMetadata(metadata) }),
    },
    message,
  );
}

export function logServerInfo(message: string, metadata?: unknown) {
  logger.info(
    { info: compactLogFields({ metadata: toLogMetadata(metadata) }) },
    message,
  );
}
