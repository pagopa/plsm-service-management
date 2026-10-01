import { format, isValid, parseISO } from "date-fns";

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
  return isValid(date) ? format(date, "HH:mm:ss dd-MM-yyyy") : String(value);
}
