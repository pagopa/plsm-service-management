"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Landmark } from "lucide-react";

import { UuidChip } from "@/components/core/uuid-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  callProductLabel,
  type MonitoringCall,
} from "@/lib/services/calls.schema";

function fmtDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeHttpUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export const callsColumns: ColumnDef<MonitoringCall>[] = [
  {
    accessorKey: "title",
    header: "Titolo",
    cell: ({ row }) => (
      <p className="font-semibold leading-tight">
        {row.original.title?.trim() || "—"}
      </p>
    ),
  },
  {
    accessorKey: "institutionName",
    header: "Ente",
    cell: ({ row }) => {
      const name = row.original.institutionName?.trim();
      const institutionId = row.original.institutionId;

      return (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Landmark className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold leading-tight">{name || "—"}</p>
            {institutionId ? <UuidChip id={institutionId} /> : null}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "productId",
    header: "Prodotto",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="border-teal-100 bg-teal-50 text-teal-800"
      >
        {callProductLabel(row.original.productId)}
      </Badge>
    ),
  },
  {
    accessorKey: "callDate",
    header: "Data call",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium tabular-nums">
          {fmtDate(row.original.callDate)}
        </p>
        <p className="text-muted-foreground text-xs tabular-nums">
          {fmtTime(row.original.callDate)}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: ({ row }) => {
      const href = safeHttpUrl(row.original.link);
      if (!href) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      return (
        <Button
          asChild
          variant="outline"
          size="icon"
          className="size-8"
          title="Apri il link della call"
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Apri il link della call"
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>
      );
    },
  },
  {
    accessorKey: "crmActivityId",
    header: "Activity CRM",
    cell: ({ row }) => <UuidChip id={row.original.crmActivityId} />,
  },
];
