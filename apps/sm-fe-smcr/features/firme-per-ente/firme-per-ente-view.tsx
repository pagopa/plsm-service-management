"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  XCircle,
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

import {
  createFirmePerEnteColumns,
  FirmePerEnteTable,
  volumeLegend,
} from "./table";

export type FirmePerEnteKpis = {
  totalFirme: number;
  totalRichieste: number;
  totalAnnullate: number;
  totalRifiutate: number;
  totalEnti: number;
  topDescription: string;
  topFirme: number;
  mediaPerEnte: number;
  universitaCount: number;
  altriEnti: number;
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

  const columns = useMemo(
    () => createFirmePerEnteColumns({ rankOffset: start }),
    [start],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Firme per ente</h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
          Firme richieste tramite Firma con IO per ente aderente, con dettaglio
          di quelle completate, annullate e rifiutate.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Pencil className="size-5 text-emerald-700" />}
          iconClassName="bg-emerald-100"
          title="Firme completate"
          value={formatItInt(kpis.totalFirme)}
          hint={`Su ${formatItInt(kpis.totalRichieste)} richieste · ${formatItPercent(
            kpis.totalRichieste > 0 ? kpis.totalFirme / kpis.totalRichieste : 0,
          )} completate`}
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
          icon={<XCircle className="size-5 text-rose-700" />}
          iconClassName="bg-rose-100"
          title="Firme non completate"
          value={formatItInt(kpis.totalAnnullate + kpis.totalRifiutate)}
          hint={`${formatItInt(kpis.totalAnnullate)} annullate · ${formatItInt(
            kpis.totalRifiutate,
          )} rifiutate`}
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

          <FirmePerEnteTable
            columns={columns}
            data={pageRows}
            isEmpty={filtered.length === 0}
          />

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
