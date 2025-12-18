import z from "zod";

export const logLevelSchema = z.enum(["DEBUG", "INFO", "WARN", "ERROR"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const logServiceSchema = z.enum(["SMCR", "AMA"]);
export type LogService = z.infer<typeof logServiceSchema>;

export const logSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  level: logLevelSchema,
  service: logServiceSchema,
  message: z.string(),
  requestId: z.string().optional().nullable(),
});
export type Log = z.infer<typeof logSchema>;
