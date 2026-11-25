import { isValid, parseISO } from "date-fns";

const logTimestampFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function parseLogTimestamp(value: string | number): Date {
  if (typeof value === "number") {
    return new Date(value);
  }

  // ISO dates without an offset represent local time, including date-only values.
  const date = parseISO(value);
  return isValid(date) ? date : new Date(value);
}

export function formatLogTimestamp(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "";
  }

  const date = parseLogTimestamp(value);
  return isValid(date) ? logTimestampFormatter.format(date) : String(value);
}
