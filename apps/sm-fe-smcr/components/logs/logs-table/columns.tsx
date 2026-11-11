"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Log } from "@/lib/services/logs.service";
import { formatLogTimestamp } from "@/lib/log-dates";
import { LogLevelBadge, LogServiceBadge } from "@/components/logs/log-badges";

export function getLogColumns(
  onOpen: (log: Log, trigger: HTMLElement) => void,
): ColumnDef<Log>[] {
  return [
    {
      accessorKey: "timestamp",
      header: "Data e ora · UTC",
      size: 184,
      cell: ({ row }) => (
        <time
          dateTime={row.original.timestamp}
          className="whitespace-nowrap font-mono text-xs tabular-nums"
        >
          {formatLogTimestamp(row.original.timestamp)}
        </time>
      ),
    },
    {
      accessorKey: "level",
      header: "Livello",
      size: 90,
      cell: ({ row }) => <LogLevelBadge level={row.original.level} />,
    },
    {
      accessorKey: "message",
      header: "Messaggio",
      cell: ({ row }) => (
        <button
          type="button"
          data-log-trigger
          data-log-id={row.original.id}
          className="block w-full rounded-sm py-1.5 text-left outline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-foreground"
          onClick={(event) => onOpen(row.original, event.currentTarget)}
        >
          <span className="sr-only">Apri dettaglio: </span>
          <span className="line-clamp-2 wrap-anywhere">
            {row.original.message}
          </span>
        </button>
      ),
    },
    {
      accessorKey: "service",
      header: "Servizio",
      size: 90,
      cell: ({ row }) => <LogServiceBadge service={row.original.service} />,
    },
  ];
}
