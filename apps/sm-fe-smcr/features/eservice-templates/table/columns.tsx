"use client";

import { Download, ShieldCheck, Radio } from "lucide-react";
import { ComponentProps } from "react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

import { UuidChip } from "@/components/core/uuid-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EserviceTemplate } from "@/lib/services/eservice-templates.service";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const modeBadgeConfig: Record<
  string,
  { label: string; variant?: BadgeVariant; className?: string }
> = {
  DELIVER: {
    label: "Erogazione",
    variant: "outline",
    className: "border-teal-100 bg-teal-50 text-teal-700",
  },
  RECEIVE: {
    label: "Fruizione",
    variant: "outline",
    className: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
  sconosciuta: { label: "sconosciuta", variant: "outline" },
};

export const TEMPLATE_MODE_ORDER = [
  "DELIVER",
  "RECEIVE",
  "sconosciuta",
] as const;

export function normalizeTemplateMode(mode: string) {
  return mode.trim() || "sconosciuta";
}

export function normalizeTemplateTechnology(technology: string) {
  return technology.trim() || "sconosciuta";
}

export function TemplateModeBadge({ mode }: { mode: string }) {
  const value = normalizeTemplateMode(mode);
  const config = modeBadgeConfig[value] ?? {
    label: value,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant ?? "outline"} className={config.className}>
      {config.label}
    </Badge>
  );
}

export function TemplateTechnologyBadge({
  technology,
}: {
  technology: string;
}) {
  return (
    <Badge variant="outline" className="font-mono text-xs uppercase">
      {normalizeTemplateTechnology(technology)}
    </Badge>
  );
}

type SortKey = "name" | "technology" | "mode";
type SortDir = "asc" | "desc";

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return (
    <span className="ml-1 inline-block opacity-70">
      {dir === "desc" ? "▼" : "▲"}
    </span>
  );
}

type CreateColumnsOptions = {
  sort: { key: SortKey; dir: SortDir };
  onSort: (key: SortKey) => void;
};

export function createEserviceTemplateColumns({
  sort,
  onSort,
}: CreateColumnsOptions): ColumnDef<EserviceTemplate>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <UuidChip id={row.original.id} />,
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
          Nome template{" "}
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
      accessorKey: "intendedTarget",
      header: "Destinatari",
      cell: ({ row }) =>
        row.original.intendedTarget ? (
          <p className="text-muted-foreground line-clamp-3 text-xs">
            {row.original.intendedTarget}
          </p>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "technology",
      header: () => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto cursor-pointer gap-0 whitespace-normal p-0 font-medium hover:bg-transparent hover:text-foreground"
          onClick={() => onSort("technology")}
        >
          Tecnologia{" "}
          <SortIndicator active={sort.key === "technology"} dir={sort.dir} />
        </Button>
      ),
      cell: ({ row }) => (
        <TemplateTechnologyBadge technology={row.original.technology} />
      ),
    },
    {
      accessorKey: "mode",
      header: () => (
        <Button
          type="button"
          variant="ghost"
          className="h-auto cursor-pointer gap-0 whitespace-normal p-0 font-medium hover:bg-transparent hover:text-foreground"
          onClick={() => onSort("mode")}
        >
          Modalità <SortIndicator active={sort.key === "mode"} dir={sort.dir} />
        </Button>
      ),
      cell: ({ row }) => <TemplateModeBadge mode={row.original.mode} />,
    },
    {
      id: "flags",
      header: "Caratteristiche",
      cell: ({ row }) => {
        const { isSignalHubEnabled, personalData } = row.original;

        if (!isSignalHubEnabled && !personalData) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {isSignalHubEnabled && (
              <Badge
                variant="outline"
                className="border-blue-100 bg-blue-50 text-blue-700"
              >
                <Radio className="size-3" />
                Signal Hub
              </Badge>
            )}
            {personalData && (
              <Badge
                variant="outline"
                className="border-amber-100 bg-amber-50 text-amber-700"
              >
                <ShieldCheck className="size-3" />
                Dati personali
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "download",
      header: "Download",
      cell: () => (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 cursor-pointer"
          onClick={() =>
            toast.info("Funzionalità in arrivo", {
              description:
                "Il download dei template e-service verrà implementato successivamente.",
            })
          }
          title="Download non ancora disponibile"
          aria-label="Download non ancora disponibile"
        >
          <Download className="size-4" />
        </Button>
      ),
    },
  ];
}
