"use client";

import { FileText, Landmark } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { FirmaPerEnteRow } from "@/lib/services/firme-per-ente.service";
import { cn } from "@/lib/utils";
import { inferEnteKind, type EnteKind } from "../entity-kind";

export const volumeLegend = [
  { key: "lt20", label: "Meno di 20", className: "bg-rose-100 text-rose-800 border-rose-200" },
  {
    key: "20-99",
    label: "Tra 20 e 99",
    className: "bg-orange-100 text-orange-900 border-orange-200",
  },
  {
    key: "100-499",
    label: "Tra 100 e 499",
    className: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    key: "gte500",
    label: "500 o più",
    className: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
] as const;

function volumeTier(count: number) {
  if (count < 20) return "lt20" as const;
  if (count < 100) return "20-99" as const;
  if (count < 500) return "100-499" as const;
  return "gte500" as const;
}

function volumeBadgeClass(count: number) {
  const tier = volumeTier(count);
  return volumeLegend.find((l) => l.key === tier)?.className ?? "";
}

const kindStyles: Record<
  EnteKind,
  { badge: string; iconWrap: string; label: string }
> = {
  UNIVERSITÀ: {
    label: "UNIVERSITÀ",
    badge: "bg-teal-100 text-teal-900 border-teal-200",
    iconWrap: "bg-teal-500 text-white",
  },
  GOV: {
    label: "GOV",
    badge: "bg-violet-100 text-violet-900 border-violet-200",
    iconWrap: "bg-violet-400 text-white",
  },
  REGIONE: {
    label: "REGIONE",
    badge: "bg-orange-100 text-orange-900 border-orange-200",
    iconWrap: "bg-orange-400 text-white",
  },
};

function formatItInt(n: number) {
  return new Intl.NumberFormat("it-IT").format(n);
}

function rankCircleClass(rank: number) {
  if (rank === 1) return "bg-amber-400 text-amber-950 shadow-sm";
  if (rank === 2) return "bg-slate-300 text-slate-900";
  if (rank === 3) return "bg-amber-700 text-amber-50";
  return "bg-sky-100 text-sky-800";
}

function KindIcon({ kind }: { kind: EnteKind }) {
  if (kind === "GOV") return <FileText className="size-4" aria-hidden />;
  return <Landmark className="size-4" aria-hidden />;
}

type CreateColumnsOptions = {
  rankOffset: number;
};

export function createFirmePerEnteColumns({
  rankOffset,
}: CreateColumnsOptions): ColumnDef<FirmaPerEnteRow>[] {
  return [
    {
      id: "rank",
      header: "#",
      cell: ({ row }) => {
        const rank = rankOffset + row.index + 1;
        return (
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold",
              rankCircleClass(rank),
            )}
          >
            {rank}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Ente",
      cell: ({ row }) => {
        const kind = inferEnteKind(row.original.description);
        const styles = kindStyles[kind];
        return (
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                styles.iconWrap,
              )}
            >
              <KindIcon kind={kind} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">
                {row.original.description}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs font-mono">
                {row.original.internalinstitutionid}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "kind",
      header: "Tipo",
      cell: ({ row }) => {
        const kind = inferEnteKind(row.original.description);
        const styles = kindStyles[kind];
        return (
          <Badge
            variant="outline"
            className={cn("font-medium", styles.badge)}
          >
            {styles.label}
          </Badge>
        );
      },
    },
    {
      id: "firme_signed",
      accessorKey: "firme_signed",
      header: () => <span className="block w-full text-right">Firmate</span>,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "font-medium tabular-nums",
            volumeBadgeClass(row.original.firme_signed),
          )}
        >
          {formatItInt(row.original.firme_signed)} firme
        </Badge>
      ),
    },
    {
      id: "firme_cancelled",
      accessorKey: "firme_cancelled",
      header: () => <span className="block w-full text-right">Annullate</span>,
      cell: ({ row }) => (
        <span
          className={cn(
            "tabular-nums text-sm",
            row.original.firme_cancelled > 0
              ? "font-medium text-amber-700"
              : "text-muted-foreground",
          )}
        >
          {formatItInt(row.original.firme_cancelled)}
        </span>
      ),
    },
    {
      id: "firme_rejected",
      accessorKey: "firme_rejected",
      header: () => <span className="block w-full text-right">Rifiutate</span>,
      cell: ({ row }) => (
        <span
          className={cn(
            "tabular-nums text-sm",
            row.original.firme_rejected > 0
              ? "font-medium text-rose-700"
              : "text-muted-foreground",
          )}
        >
          {formatItInt(row.original.firme_rejected)}
        </span>
      ),
    },
  ];
}
