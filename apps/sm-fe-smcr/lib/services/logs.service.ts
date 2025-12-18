import database from "@/lib/knex";
import z from "zod";
import logger from "@/lib/logger/logger.server";

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

export async function saveLog(
  input: Omit<Log, "id">,
): Promise<{ data: Log; error: null } | { data: null; error: string }> {
  try {
    const [log] = await database
      .from(LOGS_TABLE)
      .insert({
        timestamp: input.timestamp,
        level: input.level,
        service: input.service,
        message: input.message,
        request: input.requestId,
      })
      .returning("*");

    return { data: log, error: null };
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
