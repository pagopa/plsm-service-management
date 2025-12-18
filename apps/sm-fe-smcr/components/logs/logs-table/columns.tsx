"use client";

import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export type Log = {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  request?: string;
};

function formatTimestamp(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
      const day = `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
      return `${time} ${day}`;
    }
    return String(value);
  }
  return "";
}

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "timestamp",
    header: "Data ed ora",
    cell: ({ getValue }) => (
      <span className="font-mono text-neutral-700">
        {formatTimestamp(getValue())}
      </span>
    ),
  },
  {
    accessorKey: "level",
    header: "Livello",
    cell: ({ getValue }) => {
      const value = getValue() as LogLevel;

      switch (value) {
        case "DEBUG":
          return <span className="font-mono text-neutral-500">[DEBUG]</span>;
        case "INFO":
          return <span className="font-mono text-blue-500">[INFO]</span>;
        case "WARN":
          return <span className="font-mono text-amber-500">[WARNING]</span>;
        case "ERROR":
          return <span className="font-mono text-red-500">[ERROR]</span>;
        default:
          return value;
      }
    },
  },
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ getValue }) => (
      <span className="font-mono text-neutral-700">
        {formatTimestamp(getValue())}
      </span>
    ),
  },
  {
    accessorKey: "message",
    header: "Messaggio",
    cell: ({ getValue }) => (
      <span className="text-neutral-700">{formatTimestamp(getValue())}</span>
    ),
  },
  {
    accessorKey: "request",
    header: "Richiesta",
    cell: ({ getValue }) => {
      if (!getValue()) {
        return null;
      }

      return (
        <Badge variant="outline" className="bg-muted">
          {getValue() as string}
        </Badge>
      );
    },
  },
];
