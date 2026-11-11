import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db";
import { logs } from "@/db/schema";
import z from "zod";
import EventEmitter from "events";
import { compactLogFields } from "@/lib/logger/logger.utils";
import {
  getLogWindow,
  LOG_LEVELS,
  LOG_RANGES,
  LOG_SERVICES,
  LOGS_PAGE_SIZE,
  type LogFilters,
  type LogView,
} from "@/lib/log-filters";

const logsEventBus = new EventEmitter();
const LOGS_EVENT_BUS = "logs" as const;
const DEFAULT_LOGS_LIMIT = 100;
const MAX_LOGS_LIMIT = 500;

const logFields = {
  id: logs.id,
  timestamp: logs.timestamp,
  message: logs.message,
  level: logs.level,
  service: logs.service,
  requestId: logs.request,
};

function writeInternalLogError(message: string, error: unknown) {
  process.stderr.write(`${message}: ${formatInternalLogError(error)}\n`);
}

function formatInternalLogError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export const logLevelSchema = z.enum(LOG_LEVELS);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const logServiceSchema = z.enum(LOG_SERVICES);
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

export const logVolumeSchema = z.object({
  date: z.string(),
  debug: z.number(),
  info: z.number(),
  warn: z.number(),
  error: z.number(),
  fatal: z.number(),
});
export type LogVolume = z.infer<typeof logVolumeSchema>;

export const logRequestSchema = z
  .object({
    method: z.string().optional().nullable(),
    path: z.string().optional().nullable(),
    statusCode: z.number().int().optional().nullable(),
  })
  .transform((request) => compactLogFields(request));
export type LogRequest = z.infer<typeof logRequestSchema>;

export const logErrorSchema = z
  .object({
    name: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
    stack: z.string().optional().nullable(),
  })
  .transform((error) => compactLogFields(error));
export type LogError = z.infer<typeof logErrorSchema>;

export const logInfoSchema = z
  .object({
    event: z.string().optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .transform((info) => compactLogFields(info));
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
  // Parse here too so direct callers cannot persist retired or empty fields.
  return compactLogFields(logContextSchema.parse(input)) ?? null;
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
      writeInternalLogError("parseLogContext - invalid json", error);
      return null;
    }
  }

  const parsed = logContextSchema.safeParse(value);
  if (!parsed.success) {
    writeInternalLogError("parseLogContext - invalid context", parsed.error);
    return null;
  }

  return parsed.data;
}

type LogRow = Omit<typeof logs.$inferSelect, "request" | "context"> & {
  requestId: string | null;
};

function mapLog(row: LogRow): Log {
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    level: logLevelSchema.parse(row.level),
    service: logServiceSchema.parse(row.service),
    message: row.message,
    requestId: row.requestId,
  };
}

function mapLogDetail(row: LogRow & { context?: unknown }): LogDetail {
  const context = parseLogContext(row.context);

  return {
    ...mapLog(row),
    request: context?.request ?? null,
    error: context?.error ?? null,
    info: context?.info ?? null,
  };
}

function normalizeLogLimit(limit?: number | null): number {
  if (!limit || !Number.isFinite(limit)) {
    return DEFAULT_LOGS_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LOGS_LIMIT);
}

type ReadLogsOptions = Partial<LogFilters> & {
  limit?: number;
  before?: string | null;
  beforeId?: string;
  until?: string;
};

function logConditions(options: ReadLogsOptions) {
  const query = options.q?.trim();
  // Treat SQL wildcard characters as literal search text.
  const pattern = query ? `%${query.replace(/[\\%_]/g, "\\$&")}%` : undefined;
  const window = options.range
    ? getLogWindow(options.range, options.until)
    : null;

  return and(
    window ? gte(logs.timestamp, window.start) : undefined,
    window ? lte(logs.timestamp, window.end) : undefined,
    options.level?.length ? inArray(logs.level, options.level) : undefined,
    options.service?.length
      ? inArray(logs.service, options.service)
      : undefined,
    pattern
      ? or(ilike(logs.message, pattern), ilike(logs.request, pattern))
      : undefined,
    options.before
      ? or(
          lt(logs.timestamp, new Date(options.before)),
          options.beforeId
            ? and(
                eq(logs.timestamp, new Date(options.before)),
                lt(logs.id, options.beforeId),
              )
            : undefined,
        )
      : undefined,
  );
}

const LOG_VOLUME_LEVEL_KEYS: Record<LogLevel, keyof Omit<LogVolume, "date">> = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
};

export async function saveLog(
  input: LogInput,
): Promise<{ data: LogDetail; error: null } | { data: null; error: string }> {
  try {
    const context = buildLogContext(input);
    const [log] = await getDb()
      .insert(logs)
      .values({
        timestamp: new Date(input.timestamp),
        level: input.level,
        service: input.service,
        message: input.message,
        request: input.requestId?.trim() ? input.requestId : null,
        context,
      })
      .returning({ ...logFields, context: logs.context });

    if (!log) {
      throw new Error("Log insert returned no row");
    }

    const mappedLog = mapLogDetail({
      ...log,
      context: log.context ?? context ?? null,
    });

    emitLogEvent(mappedLog);

    return { data: mappedLog, error: null };
  } catch (error) {
    writeInternalLogError("saveLog - database error", error);
    return { data: null, error: "Error saving log." };
  }
}

export async function readLogs(
  options: ReadLogsOptions = {},
): Promise<{ data: Array<Log>; error: null } | { data: null; error: string }> {
  try {
    const limit = normalizeLogLimit(options.limit);
    const rows = await getDb()
      .select(logFields)
      .from(logs)
      .where(logConditions(options))
      .orderBy(desc(logs.timestamp), desc(logs.id))
      .limit(limit);

    return { data: rows.map(mapLog), error: null };
  } catch (error) {
    writeInternalLogError("readLogs - database error", error);
    return { data: null, error: "Error reading log." };
  }
}

export async function readLogVolume(
  options: LogFilters & { until: string },
): Promise<
  { data: Array<LogVolume>; error: null } | { data: null; error: string }
> {
  try {
    const { start, end } = getLogWindow(options.range, options.until);
    const bucketMs = LOG_RANGES[options.range].bucket;
    const firstBucket = Math.floor(start.getTime() / bucketMs) * bucketMs;
    const lastBucket = Math.floor(end.getTime() / bucketMs) * bucketMs;
    const volume: LogVolume[] = Array.from(
      { length: (lastBucket - firstBucket) / bucketMs + 1 },
      (_, index) => ({
        date: new Date(firstBucket + index * bucketMs).toISOString(),
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      }),
    );
    const volumeByDate = new Map(volume.map((item) => [item.date, item]));
    // UTC epoch buckets keep SQL and UI boundaries identical across timezones/DST.
    const bucket = sql`floor(extract(epoch from ${logs.timestamp}) / ${bucketMs / 1000}) * ${bucketMs}`;
    const date = sql<number>`${bucket}`.mapWith(Number).as("date");
    const rows = await getDb()
      .select({ date, level: logs.level, count: sql`count(*)`.mapWith(Number) })
      .from(logs)
      .where(logConditions(options))
      .groupBy(sql`"date"`, logs.level)
      .orderBy(asc(date));

    for (const row of rows) {
      const item = volumeByDate.get(new Date(row.date).toISOString());
      if (!item) {
        continue;
      }

      item[LOG_VOLUME_LEVEL_KEYS[logLevelSchema.parse(row.level)]] = row.count;
    }

    return { data: volume, error: null };
  } catch (error) {
    writeInternalLogError("readLogVolume - database error", error);
    return { data: null, error: "Error reading log volume." };
  }
}

export async function readLogView(
  filters: LogFilters,
): Promise<{ data: LogView; error: null } | { data: null; error: string }> {
  const until = new Date().toISOString();
  const [list, volume] = await Promise.all([
    readLogs({ ...filters, until, limit: LOGS_PAGE_SIZE + 1 }),
    readLogVolume({ ...filters, until }),
  ]);

  if (!list.data || !volume.data) {
    return { data: null, error: "Impossibile caricare i log. Riprova." };
  }

  return {
    data: {
      logs: list.data.slice(0, LOGS_PAGE_SIZE),
      volume: volume.data,
      from: getLogWindow(filters.range, until).start.toISOString(),
      until,
      hasMore: list.data.length > LOGS_PAGE_SIZE,
    },
    error: null,
  };
}

export async function readLogDetail(
  logId: string,
): Promise<{ data: LogDetail; error: null } | { data: null; error: string }> {
  try {
    const [log] = await getDb()
      .select({ ...logFields, context: logs.context })
      .from(logs)
      .where(eq(logs.id, logId))
      .limit(1);

    if (!log) {
      return { data: null, error: "Log not found." };
    }

    return { data: mapLogDetail(log), error: null };
  } catch (error) {
    writeInternalLogError("readLogDetail - database error", error);
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
