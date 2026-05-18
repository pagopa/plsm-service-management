"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Landmark,
  Pencil,
  Search,
  TrendingUp,
} from "lucide-react";

import type { FirmaPerEnteRow } from "@/lib/services/firme-per-ente.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { inferEnteKind, type EnteKind } from "./entity-kind";

export type FirmePerEnteKpis = {
  totalFirme: number;
  totalEnti: number;
  topDescription: string;
  topFirme: number;
  mediaPerEnte: number;
  universitaCount: number;
  altriEnti: number;
};

const volumeLegend = [
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

function formatItPercent(ratio: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ratio);
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

type Props = {
  rows: FirmaPerEnteRow[];
  kpis: FirmePerEnteKpis;
};

export function FirmePerEnteView({ rows, kpis }: Props) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.description.toLowerCase().includes(q) ||
        r.internalinstitutionid.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const rangeLabel =
    filtered.length === 0
      ? "0 di 0"
      : `${start + 1} - ${Math.min(start + pageSize, filtered.length)} di ${filtered.length}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Firme per ente</h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
          Numero totale di firme apposte tramite Firma con IO, suddivise per ente
          aderente.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Pencil className="size-5 text-sky-700" />}
          iconClassName="bg-sky-100"
          title="Firme totali"
          value={formatItInt(kpis.totalFirme)}
          hint={`Su ${formatItInt(kpis.totalEnti)} enti aderenti`}
        />
        <KpiCard
          icon={<Award className="size-5 text-amber-700" />}
          iconClassName="bg-amber-100"
          title="Ente con più firme"
          value={kpis.topDescription}
          valueClassName="text-base font-semibold leading-snug line-clamp-2"
          hint={`${formatItInt(kpis.topFirme)} firme · ${formatItPercent(
            kpis.totalFirme > 0 ? kpis.topFirme / kpis.totalFirme : 0,
          )} del totale`}
        />
        <KpiCard
          icon={<TrendingUp className="size-5 text-blue-700" />}
          iconClassName="bg-blue-100"
          title="Media per ente"
          value={formatItInt(kpis.mediaPerEnte)}
          hint="Firme per ente"
        />
        <KpiCard
          icon={<Building2 className="size-5 text-orange-800" />}
          iconClassName="bg-orange-100"
          title="Università coinvolte"
          value={formatItInt(kpis.universitaCount)}
          hint={
            kpis.altriEnti > 0
              ? `+ ${formatItInt(kpis.altriEnti)} altri enti`
              : "Solo università"
          }
        />
      </section>

      <section className="rounded-lg border bg-card px-4 py-3 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          Legenda volume firme
        </p>
        <div className="flex flex-wrap gap-2">
          {volumeLegend.map((item) => (
            <Badge
              key={item.key}
              variant="outline"
              className={cn("border font-normal", item.className)}
            >
              {item.label}
            </Badge>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden border shadow-sm py-0 gap-0">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Firme per ente</h2>
              <Badge variant="secondary" className="font-normal">
                {formatItInt(filtered.length)} enti
              </Badge>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cerca per nome o ID..."
                className="pl-9"
                aria-label="Cerca per nome o ID ente"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="border-b">
                  <th className="w-12 px-3 py-3 text-left font-medium">#</th>
                  <th className="px-3 py-3 text-left font-medium">Ente</th>
                  <th className="px-3 py-3 text-left font-medium">Tipo</th>
                  <th className="w-36 px-3 py-3 text-right font-medium">Firme</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => {
                  const rank = start + i + 1;
                  const kind = inferEnteKind(row.description);
                  const styles = kindStyles[kind];
                  return (
                    <tr
                      key={row.internalinstitutionid}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-3 align-middle">
                        <span
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                            rankCircleClass(rank),
                          )}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
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
                              {row.description}
                            </p>
                            <p className="text-muted-foreground mt-0.5 truncate text-xs font-mono">
                              {row.internalinstitutionid}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <Badge
                          variant="outline"
                          className={cn("font-medium", styles.badge)}
                        >
                          {styles.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right align-middle">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium tabular-nums",
                            volumeBadgeClass(row.totale_firme),
                          )}
                        >
                          {formatItInt(row.totale_firme)} firme
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                Nessun ente corrisponde alla ricerca.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[72px]" aria-label="Righe per pagina">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per pagina</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">{rangeLabel}</p>
            <div className="flex justify-center gap-1 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Pagina successiva"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  iconClassName,
  title,
  value,
  hint,
  valueClassName,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  value: string;
  hint: string;
  valueClassName?: string;
}) {
  return (
    <Card className="border shadow-sm gap-0 py-0">
      <CardContent className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg",
              iconClassName,
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className={cn("text-2xl font-bold tracking-tight", valueClassName)}>
              {value}
            </p>
            <p className="text-muted-foreground text-xs">{hint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
