"use client";

import { Check, Copy, Download, Landmark } from "lucide-react";
import { ComponentProps, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WalletRow } from "@/lib/services/wallet.service";
import { cn } from "@/lib/utils";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const stateBadgeConfig: Record<
  string,
  { variant?: BadgeVariant; className?: string }
> = {
  Active: { variant: "outline-success" },
  Suspended: { variant: "outline-warning" },
  Rejected: { variant: "outline-destructive" },
  Pending: {
    variant: "outline",
    className: "border-amber-100 bg-amber-50 text-amber-700",
  },
  MissingCertifiedAttributes: {
    variant: "outline",
    className: "border-blue-100 bg-blue-50 text-blue-700",
  },
  Archived: { variant: "secondary" },
  sconosciuto: { variant: "outline" },
};

export const WALLET_STATE_ORDER = [
  "Active",
  "Suspended",
  "Rejected",
  "Pending",
  "MissingCertifiedAttributes",
  "Archived",
  "sconosciuto",
] as const;

export function normalizeWalletState(state: string) {
  return state.trim() || "sconosciuto";
}

export function WalletStateBadge({ state }: { state: string }) {
  const label = normalizeWalletState(state);
  const config = stateBadgeConfig[label] ?? { variant: "outline" as const };

  return (
    <Badge variant={config.variant ?? "outline"} className={config.className}>
      {label}
    </Badge>
  );
}

type EnteKind = "com" | "reg" | "uni" | "gov";

function classifyEnte(name: string): EnteKind {
  const n = (name || "").toLowerCase();
  if (n.startsWith("comune")) return "com";
  if (n.startsWith("regione")) return "reg";
  if (n.startsWith("università") || n.startsWith("universita")) return "uni";
  return "gov";
}

const enteLabel: Record<EnteKind, string> = {
  com: "Comune",
  reg: "Regione",
  uni: "Università",
  gov: "Ente nazionale",
};

const enteIconStyle: Record<EnteKind, string> = {
  com: "bg-teal-100 text-teal-700",
  reg: "bg-orange-100 text-orange-700",
  uni: "bg-blue-100 text-blue-700",
  gov: "bg-indigo-100 text-indigo-700",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function shortId(id: string) {
  return id.slice(0, 8);
}

type SortKey = "name" | "nomeEnte" | "state" | "createdat";
type SortDir = "asc" | "desc";

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return (
    <span className="ml-1 inline-block opacity-70">
      {dir === "desc" ? "▼" : "▲"}
    </span>
  );
}

function UuidChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onCopy}
      title={id}
      className="bg-muted/60 hover:bg-muted/60 hover:border-primary hover:text-primary h-auto gap-1.5 rounded-md border px-2 py-1 font-normal transition-colors has-[>svg]:px-2"
    >
      <span className="font-mono text-xs">{shortId(id)}</span>
      {copied ? (
        <Check className="size-3" />
      ) : (
        <Copy className="size-3 opacity-60" />
      )}
    </Button>
  );
}

function getInterfaceDownloadUrl(row: WalletRow): string | null {
  if (!row.descriptorid) {
    return null;
  }

  const params = new URLSearchParams({
    eserviceId: row.id,
    descriptorId: row.descriptorid,
    filename: `${row.name || row.id}.yaml`,
  });

  return `/api/pdnd/eservice-interface?${params.toString()}`;
}

type CreateColumnsOptions = {
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
};

export function createWalletColumns({
  sort,
  onSort,
}: CreateColumnsOptions): ColumnDef<WalletRow>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <UuidChip id={row.original.id} />,
    },
    {
      accessorKey: "descriptorid",
      header: "Descriptor ID",
      cell: ({ row }) =>
        row.original.descriptorid ? (
          <UuidChip id={row.original.descriptorid} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "name",
      header: () => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto cursor-pointer gap-0 whitespace-normal p-0 font-medium hover:bg-transparent hover:text-foreground"
          onClick={() => onSort("name")}
        >
          Nome servizio{" "}
          <SortIndicator active={sort.key === "name"} dir={sort.dir} />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold leading-tight">{row.original.name}</p>
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "nomeEnte",
      header: () => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto cursor-pointer gap-0 whitespace-normal p-0 font-medium hover:bg-transparent hover:text-foreground"
          onClick={() => onSort("nomeEnte")}
        >
          Ente <SortIndicator active={sort.key === "nomeEnte"} dir={sort.dir} />
        </Button>
      ),
      cell: ({ row }) => {
        const kind = classifyEnte(row.original.nomeEnte);
        return (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                enteIconStyle[kind],
              )}
            >
              <Landmark className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">
                {row.original.nomeEnte}
              </p>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                {enteLabel[kind]}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "state",
      header: () => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto cursor-pointer gap-0 whitespace-normal p-0 font-medium hover:bg-transparent hover:text-foreground"
          onClick={() => onSort("state")}
        >
          Stato <SortIndicator active={sort.key === "state"} dir={sort.dir} />
        </Button>
      ),
      cell: ({ row }) => <WalletStateBadge state={row.original.state} />,
    },
    {
      accessorKey: "createdat",
      header: () => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto cursor-pointer gap-0 whitespace-normal p-0 font-medium hover:bg-transparent hover:text-foreground"
          onClick={() => onSort("createdat")}
        >
          Data creazione{" "}
          <SortIndicator active={sort.key === "createdat"} dir={sort.dir} />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium tabular-nums">
            {fmtDate(row.original.createdat)}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {fmtTime(row.original.createdat)}
          </p>
        </div>
      ),
    },
    {
      id: "interface",
      header: "Interfaccia",
      cell: ({ row }) => {
        const href = getInterfaceDownloadUrl(row.original);

        if (!href) {
          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled
              title="Descriptor ID non disponibile"
              aria-label="Descriptor ID non disponibile"
            >
              <Download className="size-4" />
            </Button>
          );
        }

        return (
          <Button
            asChild
            variant="outline"
            size="icon"
            className="size-8"
            title="Scarica interfaccia YAML"
          >
            <a href={href} aria-label="Scarica interfaccia YAML">
              <Download className="size-4" />
            </a>
          </Button>
        );
      },
    },
  ];
}
