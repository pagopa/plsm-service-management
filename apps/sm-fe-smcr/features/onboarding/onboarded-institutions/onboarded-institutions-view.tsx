"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import type { OnboardedInstitution } from "@/lib/services/onboarded-institutions.service";

import {
  buildOnboardedInstitutionsHref,
  type OnboardedInstitutionsFilters,
} from "./filters";
import {
  OnboardedInstitutionsTable,
  onboardedInstitutionsColumns,
} from "./table";

const ALL_PRODUCTS = "all";

function formatItInt(n: number) {
  return new Intl.NumberFormat("it-IT").format(n);
}

type Props = {
  rows: OnboardedInstitution[];
  initialFilters?: OnboardedInstitutionsFilters;
};

export function OnboardedInstitutionsView({ rows, initialFilters }: Props) {
  const [from, setFrom] = useState(initialFilters?.from ?? "");
  const [to, setTo] = useState(initialFilters?.to ?? "");
  const [product, setProduct] = useState(
    initialFilters?.product || ALL_PRODUCTS,
  );
  const [query, setQuery] = useState(initialFilters?.search ?? "");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  // Sincronizza i filtri nell'URL senza navigazione server (niente re-download del report).
  useEffect(() => {
    const href = buildOnboardedInstitutionsHref({
      product: product === ALL_PRODUCTS ? "" : product,
      from,
      to,
      search: query,
    });
    if (href !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", href);
    }
  }, [product, from, to, query]);

  const products = useMemo(() => {
    const set = new Set(rows.map((r) => r.prodotto));
    // Il prodotto preimpostato da URL resta selezionabile anche senza righe.
    if (initialFilters?.product) set.add(initialFilters.product);
    return [...set].sort();
  }, [rows, initialFilters?.product]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!from || r.giorno_attivazione >= from) &&
        (!to || r.giorno_attivazione <= to) &&
        (product === ALL_PRODUCTS || r.prodotto === product) &&
        (!q ||
          r.nome_ente.toLowerCase().includes(q) ||
          r.id_ente.toLowerCase().includes(q)),
    );
  }, [rows, from, to, product, query]);

  const distinctInstitutions = useMemo(
    () => new Set(filtered.map((r) => r.id_ente)).size,
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const rangeLabel =
    filtered.length === 0
      ? "0 di 0"
      : `${start + 1} - ${Math.min(start + pageSize, filtered.length)} di ${formatItInt(filtered.length)}`;

  const hasFilters = Boolean(from || to || product !== ALL_PRODUCTS || query);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Enti onboardati</h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
          Onboarding attivi per data di attivazione, prodotto ed ente.
        </p>
      </header>

      <Card className="gap-0 overflow-hidden border py-0 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Onboarding</h2>
              <Badge variant="secondary" className="font-normal">
                {formatItInt(filtered.length)} onboarding
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {formatItInt(distinctInstitutions)} enti
              </Badge>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                  className="sm:w-40"
                  aria-label="Data di attivazione dal"
                />
                <span className="text-muted-foreground text-sm">–</span>
                <Input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                  className="sm:w-40"
                  aria-label="Data di attivazione al"
                />
              </div>
              <Select
                value={product}
                onValueChange={(v) => {
                  setProduct(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="sm:w-52"
                  aria-label="Filtra per prodotto"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PRODUCTS}>Tutti i prodotti</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-auto sm:min-w-72">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
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
              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setProduct(ALL_PRODUCTS);
                    setQuery("");
                    setPage(1);
                  }}
                >
                  Azzera filtri
                </Button>
              )}
            </div>
          </div>

          <OnboardedInstitutionsTable
            columns={onboardedInstitutionsColumns}
            data={pageRows}
            isEmpty={filtered.length === 0}
          />

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="h-8 w-[72px]"
                  aria-label="Righe per pagina"
                >
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
            <p className="text-muted-foreground text-center text-sm">
              {rangeLabel}
            </p>
            <div className="flex justify-center gap-1 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={safePage <= 1}
                onClick={() => setPage(Math.max(1, safePage - 1))}
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
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
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
