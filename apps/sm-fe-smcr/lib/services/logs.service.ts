import database from "@/lib/knex";
import z from "zod";
import logger from "@/lib/logger/logger.server";
import EventEmitter from "events";

const logsEventBus = new EventEmitter();
const LOGS_EVENT_BUS = "logs" as const;
const LOGS_TABLE = "logs" as const;

export const logLevelSchema = z.enum(["DEBUG", "INFO", "WARN", "ERROR"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const logServiceSchema = z.enum(["SMCR", "AMA"]);
export type LogService = z.infer<typeof logServiceSchema>;

export const logSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  level: logLevelSchema,
  service: logServiceSchema,
  message: z.string(),
  requestId: z.string().optional().nullable(),
});
export type Log = z.infer<typeof logSchema>;

export const logRequestSchema = z.object({
  method: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
  statusCode: z.number().int().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  environment: z.string().optional().nullable(),
  host: z.string().optional().nullable(),
  ip: z.string().optional().nullable(),
  traceId: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});
export type LogRequest = z.infer<typeof logRequestSchema>;

export const logErrorSchema = z.object({
  name: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  stack: z.string().optional().nullable(),
});
export type LogError = z.infer<typeof logErrorSchema>;

export const logInfoSchema = z.object({
  event: z.string().optional().nullable(),
  actor: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});
export type LogInfo = z.infer<typeof logInfoSchema>;

export const logContextSchema = z.object({
  request: logRequestSchema.optional().nullable(),
  error: logErrorSchema.optional().nullable(),
  info: logInfoSchema.optional().nullable(),
});
export type LogContext = z.infer<typeof logContextSchema>;

export const logDetailSchema = logSchema.extend({
  request: logRequestSchema.optional().nullable(),
  error: logErrorSchema.optional().nullable(),
  info: logInfoSchema.optional().nullable(),
});
export type LogDetail = z.infer<typeof logDetailSchema>;

export const logInputSchema = logSchema.omit({ id: true }).extend({
  request: logRequestSchema.optional().nullable(),
  error: logErrorSchema.optional().nullable(),
  info: logInfoSchema.optional().nullable(),
});
export type LogInput = z.infer<typeof logInputSchema>;

function buildLogContext(input: LogInput): LogContext | null {
  const context: LogContext = {};

  if (input.request) {
    context.request = input.request;
  }

  if (input.error) {
    context.error = input.error;
  }

  if (input.info) {
    context.info = input.info;
  }

  return Object.keys(context).length > 0 ? context : null;
}

function parseLogContext(raw: unknown): LogContext | null {
  if (!raw) {
    return null;
  }

  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch (error) {
      logger.warn({ error }, "parseLogContext - invalid json");
      return null;
    }
  }

  const parsed = logContextSchema.safeParse(value);
  if (!parsed.success) {
    logger.warn({ error: parsed.error }, "parseLogContext - invalid context");
    return null;
  }

  return parsed.data;
}

function mapLogDetail(row: {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: LogService;
  message: string;
  requestId?: string | null;
  context?: unknown;
}): LogDetail {
  const context = parseLogContext(row.context);

  return {
    id: row.id,
    timestamp: row.timestamp,
    level: row.level,
    service: row.service,
    message: row.message,
    requestId: row.requestId ?? null,
    request: context?.request ?? null,
    error: context?.error ?? null,
    info: context?.info ?? null,
  };
}

export async function saveLog(
  input: LogInput,
): Promise<{ data: LogDetail; error: null } | { data: null; error: string }> {
  try {
    const context = buildLogContext(input);
    const [log] = await database
      .from(LOGS_TABLE)
      .insert({
        timestamp: input.timestamp,
        level: input.level,
        service: input.service,
        message: input.message,
        request: input.requestId,
        context,
      })
      .returning("*");

    const mappedLog = mapLogDetail({
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      service: log.service,
      message: log.message,
      requestId: log.request ?? log.requestId ?? null,
      context: log.context ?? context ?? null,
    });

    emitLogEvent(mappedLog);

    return { data: mappedLog, error: null };
  } catch (error) {
    logger.error({ error }, "saveLog - database error");
    return { data: null, error: "Error saving log." };
  }
}

export async function readLogs(): Promise<
  { data: Array<Log>; error: null } | { data: null; error: string }
> {
  try {
    const logs = await database
      .from(LOGS_TABLE)
      .select([
        "id",
        "timestamp",
        "message",
        "level",
        "service",
        "request as requestId",
      ])
      .orderBy("timestamp", "desc");

    return { data: logs, error: null };
  } catch (error) {
    logger.error({ error }, "readLogs - database error");
    return { data: null, error: "Error reading log." };
  }
}

export async function readLogDetail(
  logId: string,
): Promise<{ data: LogDetail; error: null } | { data: null; error: string }> {
  try {
    const log = await database
      .from(LOGS_TABLE)
      .select([
        "id",
        "timestamp",
        "message",
        "level",
        "service",
        "request as requestId",
        "context",
      ])
      .where({ id: logId })
      .first();

    if (!log) {
      return { data: null, error: "Log not found." };
    }

    return { data: mapLogDetail(log), error: null };
  } catch (error) {
    logger.error({ error }, "readLogDetail - database error");
    return { data: null, error: "Error reading log detail." };
  }
}

export function emitLogEvent(log: Log) {
  logsEventBus.emit(LOGS_EVENT_BUS, log);
}

export function subscribeLogEvets(onLog: (log: Log) => void) {
  const handler = (log: Log) => onLog(log);
  logsEventBus.on(LOGS_EVENT_BUS, handler);

  return () => {
    logsEventBus.off(LOGS_EVENT_BUS, handler);
  };
}
