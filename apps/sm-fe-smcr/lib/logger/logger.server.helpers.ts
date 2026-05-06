import logger from "@/lib/logger/logger.server";
import { toLogError, toLogMetadata } from "@/lib/logger/logger.utils";

export function logServerError(
  error: unknown,
  message: string,
  metadata?: unknown,
) {
  logger.error(
    {
      error: toLogError(error),
      info: metadata ? { metadata: toLogMetadata(metadata) } : undefined,
    },
    message,
  );
}

export function logServerInfo(message: string, metadata?: unknown) {
  if (!metadata) {
    logger.info(message);
    return;
  }

  logger.info(
    { info: { metadata: toLogMetadata(metadata) } },
    message,
  );
}
