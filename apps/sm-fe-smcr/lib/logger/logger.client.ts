import { toLogError, toLogMetadata } from "@/lib/logger/logger.utils";

type ClientLogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

type ClientLogContext = {
  requestId?: string;
  message?: string;
  error?: unknown;
  info?: {
    event?: string;
    actor?: string;
    subject?: string;
    metadata?: unknown;
  };
};

async function sendClientLog(
  level: ClientLogLevel,
  input: string | ClientLogContext,
  fallbackMessage?: string,
) {
  const context = typeof input === "string" ? {} : input;
  const message = typeof input === "string" ? input : fallbackMessage || input.message;

  if (!message) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: "SMCR",
    message,
    requestId: context.requestId || crypto.randomUUID(),
    error: context.error ? toLogError(context.error) : undefined,
    info: context.info
      ? {
          ...context.info,
          metadata: context.info.metadata
            ? toLogMetadata(context.info.metadata)
            : undefined,
        }
      : undefined,
  };

  try {
    await fetch("/api/monitoring/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Client logging must never affect UI behavior.
  }
}

const clientLogger = {
  debug: (input: string | ClientLogContext, message?: string) =>
    sendClientLog("DEBUG", input, message),
  info: (input: string | ClientLogContext, message?: string) =>
    sendClientLog("INFO", input, message),
  warn: (input: string | ClientLogContext, message?: string) =>
    sendClientLog("WARN", input, message),
  error: (input: string | ClientLogContext, message?: string) =>
    sendClientLog("ERROR", input, message),
};

export default clientLogger;
