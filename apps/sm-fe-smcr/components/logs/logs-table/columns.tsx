"use client";

import { Log, LogLevel } from "@/lib/services/logs.service";
import { Badge } from "@/components/ui/badge";
import { Pillow } from "@/components/ui/pillow";
import { ColumnDef } from "@tanstack/react-table";
import { BotMessageSquareIcon, LayoutDashboardIcon } from "lucide-react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

function formatTimestamp(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    const date = dayjs(value);
    if (date.isValid()) {
      return date.format("HH:mm:ss DD-MM-YYYY");
    }
    return String(value);
  }
  return "";
}

import type { FilterFn } from "@tanstack/react-table";

export const levelsFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const selected = (filterValue ?? []) as string[];
  if (selected.length === 0) return true; // nessun filtro => tutto visibile

  const rowValue = row.getValue(columnId);
  if (rowValue == null) return false;

  if (typeof rowValue === "string") return selected.includes(rowValue);

  return selected.includes(String(rowValue));
};

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "timestamp",
    header: () => (
      <div className="h-full inline-flex items-center gap-3">
        <Pillow className="opacity-0" />

        <span>Data ed ora</span>
      </div>
    ),
    cell: ({ row, getValue }) => {
      const level = row.original.level as LogLevel;

      const getLevelPillow = (level: LogLevel) => {
        switch (level) {
          case "DEBUG":
            return <Pillow variant="debug" />;
          case "INFO":
            return <Pillow variant="info" />;
          case "WARN":
            return <Pillow variant="warn" />;
          case "ERROR":
            return <Pillow variant="error" />;
          default:
            return <Pillow />;
        }
      };

      return (
        <div className="h-full inline-flex items-center gap-3">
          {getLevelPillow(level)}

          <span className="font-mono text-neutral-700">
            {formatTimestamp(String(getValue()))}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "message",
    header: "Messaggio",
    cell: ({ getValue }) => (
      <span className="text-neutral-700">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ getValue }) => getServiceBadge(getValue() as string),
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
    filterFn: levelsFilterFn,
  },
  {
    accessorKey: "requestId",
    header: "ID Richiesta",
    cell: ({ getValue }) => {
      if (!getValue()) {
        return null;
      }

      return (
        <Badge variant="outline" className="font-mono font-normal bg-muted">
          {getValue() as string}
        </Badge>
      );
    },
  },
];

const getServiceBadge = (service: string) => {
  switch (service) {
    case "SMCR":
      return (
        <Badge variant="outline" className="bg-secondary font-normal">
          <LayoutDashboardIcon className="opacity-60" />
          SMCR
        </Badge>
      );
    case "AMA":
      return (
        <Badge variant="outline" className="bg-secondary font-normal">
          <BotMessageSquareIcon className="opacity-60" />
          Ask Me Anything
        </Badge>
      );
    default:
      return <Badge>{service}</Badge>;
  }
};
