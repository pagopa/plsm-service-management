"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Landmark,
  Search,
  Wallet,
  X,
} from "lucide-react";

import type { WalletRow } from "@/lib/services/wallet.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

const fmtNum = new Intl.NumberFormat("it-IT");

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

type SortKey = "name" | "nomeEnte" | "createdat";
type SortDir = "asc" | "desc";

type Props = {
  rows: WalletRow[];
};

export function WalletView({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [ente, setEnte] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "createdat",
    dir: "desc",
  });
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const total = rows.length;

  const allEnti = useMemo(() => {
    return [...new Set(rows.map((r) => r.nomeEnte))].sort((a, b) =>
      a.localeCompare(b, "it"),
    );
  }, [rows]);

  const lastDate = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce(
      (m, r) => (r.createdat > m ? r.createdat : m),
      rows[0]!.createdat,
    );
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (ente && r.nomeEnte !== ente) return false;
      return true;
    });
  }, [rows, query, ente]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      return dir === "asc"
        ? av.localeCompare(bv, "it")
        : bv.localeCompare(av, "it");
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const rangeLabel =
    sorted.length === 0
      ? "0 di 0"
      : `${start + 1} – ${Math.min(start + pageSize, sorted.length)} di ${sorted.length}`;

  const flip = (key: SortKey) => {
    if (sort.key === key) {
      setSort({ key, dir: sort.dir === "desc" ? "asc" : "desc" });
    } else {
      setSort({ key, dir: key === "createdat" ? "desc" : "asc" });
    }
  };

  const clearFilters = () => {
    setQuery("");
    setEnte("");
    setPage(1);
  };

  const hasFilters = query.trim() !== "" || ente !== "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
          Servizi di interoperabilità erogati verso IT Wallet — il portafoglio
          digitale italiano.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2 border shadow-sm gap-0 py-0 bg-gradient-to-br from-teal-50 to-white border-teal-100">
          <CardContent className="flex flex-col gap-2 p-5 md:p-6">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <span className="bg-teal-100 text-teal-700 inline-flex size-7 items-center justify-center rounded-md">
                <Wallet className="size-4" />
              </span>
              Totale Servizi Wallet
            </div>
            <p className="text-5xl font-extrabold tracking-tight tabular-nums">
              {fmtNum.format(total)}
            </p>
            <p className="text-muted-foreground text-xs">
              {filtered.length !== total
                ? `${fmtNum.format(filtered.length)} corrispondono ai filtri attivi`
                : "Tutti i servizi attualmente disponibili"}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm gap-0 py-0">
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <span className="bg-indigo-100 text-indigo-700 inline-flex size-7 items-center justify-center rounded-md">
                <Landmark className="size-4" />
              </span>
              Enti erogatori
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {fmtNum.format(allEnti.length)}
            </p>
            <p className="text-muted-foreground text-xs">
              Distinti tra comuni, regioni ed enti centrali
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm gap-0 py-0">
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <span className="bg-amber-100 text-amber-700 inline-flex size-7 items-center justify-center rounded-md">
                <Calendar className="size-4" />
              </span>
              Ultimo servizio aggiunto
            </div>
            <p className="text-lg font-bold tracking-tight">
              {lastDate ? fmtDate(lastDate) : "—"}
            </p>
            <p className="text-muted-foreground text-xs">
              {lastDate ? `alle ${fmtTime(lastDate)}` : ""}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden border shadow-sm py-0 gap-0">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-72">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cerca per nome servizio…"
                  className="pl-9 pr-9"
                  aria-label="Cerca per nome servizio"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
                    aria-label="Pulisci ricerca"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <EnteCombo value={ente} onChange={setEnte} options={allEnti} />
              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="size-3.5" />
                  Azzera filtri
                </Button>
              )}
            </div>
            <div className="text-muted-foreground text-sm">
              <span className="text-foreground font-semibold tabular-nums">
                {fmtNum.format(filtered.length)}
              </span>{" "}
              di {fmtNum.format(total)}{" "}
              {total === 1 ? "servizio" : "servizi"}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="border-b">
                  <th className="w-32 px-3 py-3 text-left font-medium">ID</th>
                  <th
                    className="px-3 py-3 text-left font-medium cursor-pointer hover:text-foreground"
                    onClick={() => flip("name")}
                  >
                    Nome servizio{" "}
                    <SortIndicator
                      active={sort.key === "name"}
                      dir={sort.dir}
                    />
                  </th>
                  <th
                    className="w-72 px-3 py-3 text-left font-medium cursor-pointer hover:text-foreground"
                    onClick={() => flip("nomeEnte")}
                  >
                    Ente{" "}
                    <SortIndicator
                      active={sort.key === "nomeEnte"}
                      dir={sort.dir}
                    />
                  </th>
                  <th
                    className="w-40 px-3 py-3 text-left font-medium cursor-pointer hover:text-foreground"
                    onClick={() => flip("createdat")}
                  >
                    Data creazione{" "}
                    <SortIndicator
                      active={sort.key === "createdat"}
                      dir={sort.dir}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const kind = classifyEnte(r.nomeEnte);
                  return (
                    <tr
                      key={r.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-3 align-middle">
                        <UuidChip id={r.id} />
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-semibold leading-tight">
                            {r.name}
                          </p>
                          <p className="text-muted-foreground line-clamp-2 text-xs">
                            {r.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
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
                              {r.nomeEnte}
                            </p>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                              {enteLabel[kind]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-medium tabular-nums">
                            {fmtDate(r.createdat)}
                          </p>
                          <p className="text-muted-foreground text-xs tabular-nums">
                            {fmtTime(r.createdat)}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                Nessun servizio corrisponde ai filtri impostati.
              </p>
            )}
          </div>

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
                  <SelectItem value="100">100</SelectItem>
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
    <button
      type="button"
      onClick={onCopy}
      title={id}
      className="bg-muted/60 hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors"
    >
      <span className="font-mono text-xs">{shortId(id)}</span>
      {copied ? (
        <Check className="size-3" />
      ) : (
        <Copy className="size-3 opacity-60" />
      )}
    </button>
  );
}

function EnteCombo({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;
    return options.filter((o) => o.toLowerCase().includes(qq));
  }, [options, q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-w-[220px] justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <Landmark className="size-4 opacity-70" />
            <span className="truncate">{value || "Tutti gli enti"}</span>
          </span>
          <span className="ml-2 flex items-center gap-1">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange("");
                  }
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center"
                aria-label="Rimuovi filtro ente"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-4 opacity-70" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-2 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtra enti…"
              className="h-8 pl-7"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm",
              value === "" && "bg-teal-50 text-teal-800 font-medium",
            )}
          >
            <span>Tutti gli enti</span>
            {value === "" && <Check className="size-4" />}
          </button>
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm",
                value === opt && "bg-teal-50 text-teal-800 font-medium",
              )}
            >
              <span className="truncate">{opt}</span>
              {value === opt && <Check className="size-4 shrink-0" />}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground p-3 text-center text-sm">
              Nessun ente trovato
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
