import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { z } from "zod";
import type { Log, LogVolume } from "@/lib/services/logs.service";

export const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"] as const;
export const LOG_SERVICES = ["SMCR", "AMA"] as const;
export const LOG_RANGE_KEYS = [
  "15_minutes",
  "1_hour",
  "24_hours",
  "7_days",
  "30_days",
] as const;
export type LogRange = (typeof LOG_RANGE_KEYS)[number];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const LOG_RANGES: Record<
  LogRange,
  { label: string; duration: number; bucket: number; bucketLabel: string }
> = {
  "15_minutes": {
    label: "Ultimi 15 minuti",
    duration: 15 * MINUTE,
    bucket: MINUTE,
    bucketLabel: "al minuto",
  },
  "1_hour": {
    label: "Ultima ora",
    duration: HOUR,
    bucket: MINUTE,
    bucketLabel: "al minuto",
  },
  "24_hours": {
    label: "Ultime 24 ore",
    duration: DAY,
    bucket: HOUR,
    bucketLabel: "all’ora",
  },
  "7_days": {
    label: "Ultimi 7 giorni",
    duration: 7 * DAY,
    bucket: 6 * HOUR,
    bucketLabel: "ogni 6 ore",
  },
  "30_days": {
    label: "Ultimi 30 giorni",
    duration: 30 * DAY,
    bucket: DAY,
    bucketLabel: "al giorno",
  },
};

export const LOGS_PAGE_SIZE = 100;
export const MAX_LOADED_LOGS = 1_000;
export const MAX_LOG_SEARCH_LENGTH = 200;

export const logFilterParsers = {
  q: parseAsString.withDefault(""),
  level: parseAsArrayOf(parseAsStringLiteral(LOG_LEVELS)).withDefault([]),
  service: parseAsArrayOf(parseAsStringLiteral(LOG_SERVICES)).withDefault([]),
  range: parseAsStringLiteral(LOG_RANGE_KEYS).withDefault("1_hour"),
};

export const loadLogFilters = createLoader(logFilterParsers);
export const serializeLogFilters = createSerializer(logFilterParsers);
export type LogFilters = inferParserType<typeof logFilterParsers>;

const csv = (value: unknown) =>
  typeof value === "string" ? value.split(",").filter(Boolean) : value;

// Validate API input independently of the forgiving URL parsers used by the UI.
export const logQuerySchema = z
  .object({
    q: z.string().trim().max(MAX_LOG_SEARCH_LENGTH).default(""),
    level: z.preprocess(csv, z.array(z.enum(LOG_LEVELS)).default([])),
    service: z.preprocess(csv, z.array(z.enum(LOG_SERVICES)).default([])),
    range: z.enum(LOG_RANGE_KEYS).default("1_hour"),
    limit: z.coerce.number().int().min(1).max(500).default(LOGS_PAGE_SIZE),
    before: z.iso.datetime({ offset: true }).optional(),
    beforeId: z.uuid().optional(),
    until: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((query) => !query.beforeId || Boolean(query.before), {
    message: "Il cursore richiede una data.",
    path: ["before"],
  });

export function getLogWindow(
  range: LogRange,
  until = new Date().toISOString(),
) {
  const end = new Date(until);
  return { start: new Date(end.getTime() - LOG_RANGES[range].duration), end };
}

export function matchesLogFilters(
  log: Log,
  filters: LogFilters,
  now = Date.now(),
) {
  const timestamp = Date.parse(log.timestamp);
  const query = filters.q.trim().toLowerCase();
  return (
    timestamp >= now - LOG_RANGES[filters.range].duration &&
    timestamp <= now &&
    (!filters.level.length || filters.level.includes(log.level)) &&
    (!filters.service.length || filters.service.includes(log.service)) &&
    (!query ||
      log.message.toLowerCase().includes(query) ||
      Boolean(log.requestId?.toLowerCase().includes(query)))
  );
}

export type LogView = {
  logs: Log[];
  volume: LogVolume[];
  from: string;
  until: string;
  hasMore: boolean;
};
