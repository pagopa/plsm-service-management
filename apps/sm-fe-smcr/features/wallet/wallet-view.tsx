"use client";

import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Landmark,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WalletRow } from "@/lib/services/wallet.service";
import { cn } from "@/lib/utils";

import {
  createWalletColumns,
  normalizeWalletState,
  WALLET_STATE_ORDER,
  WalletStateBadge,
  WalletTable,
} from "./table";

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

type SortKey = "name" | "nomeEnte" | "state" | "createdat";
type SortDir = "asc" | "desc";

type Props = {
  rows: WalletRow[];
};

export function WalletView({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [ente, setEnte] = useState("");
  const [state, setState] = useState("");
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

  const allStates = useMemo(() => {
    const fromData = [
      ...new Set(rows.map((r) => normalizeWalletState(r.state))),
    ];
    return fromData.sort((a, b) => {
      const ai = WALLET_STATE_ORDER.indexOf(
        a as (typeof WALLET_STATE_ORDER)[number],
      );
      const bi = WALLET_STATE_ORDER.indexOf(
        b as (typeof WALLET_STATE_ORDER)[number],
      );
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b, "it");
    });
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
      if (state && normalizeWalletState(r.state) !== state) return false;
      return true;
    });
  }, [rows, query, ente, state]);

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

  const clearFilters = () => {
    setQuery("");
    setEnte("");
    setState("");
    setPage(1);
  };

  const hasFilters = query.trim() !== "" || ente !== "" || state !== "";

  const columns = useMemo(
    () =>
      createWalletColumns({
        sort,
        onSort: (key) => {
          if (sort.key === key) {
            setSort({ key, dir: sort.dir === "desc" ? "asc" : "desc" });
          } else {
            setSort({ key, dir: key === "createdat" ? "desc" : "asc" });
          }
        },
      }),
    [sort],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
          E-Services erogati verso IT Wallet.
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 h-auto -translate-y-1/2 rounded p-1 hover:bg-transparent has-[>svg]:p-1"
                    aria-label="Pulisci ricerca"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
              <EnteCombo
                value={ente}
                onChange={(v) => {
                  setEnte(v);
                  setPage(1);
                }}
                options={allEnti}
              />
              <StateCombo
                value={state}
                onChange={(v) => {
                  setState(v);
                  setPage(1);
                }}
                options={allStates}
              />
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
              di {fmtNum.format(total)} {total === 1 ? "servizio" : "servizi"}
            </div>
          </div>

          <WalletTable
            columns={columns}
            data={pageRows}
            isEmpty={sorted.length === 0}
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

function StateCombo({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-w-[200px] justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <CircleDot className="size-4 opacity-70" />
            <span className="truncate">
              {value ? <WalletStateBadge state={value} /> : "Tutti gli stati"}
            </span>
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
                aria-label="Rimuovi filtro stato"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-4 opacity-70" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-1">
        <ScrollArea className="max-h-72">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "hover:bg-muted hover:text-foreground flex h-auto w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-normal",
              value === "" && "bg-teal-50 text-teal-800 font-medium hover:text-teal-800",
            )}
          >
            <span>Tutti gli stati</span>
            {value === "" && <Check className="size-4" />}
          </Button>
          {options.map((opt) => (
            <Button
              key={opt}
              type="button"
              variant="ghost"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "hover:bg-muted hover:text-foreground flex h-auto w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-normal",
                value === opt && "bg-teal-50 text-teal-800 font-medium hover:text-teal-800",
              )}
            >
              <WalletStateBadge state={opt} />
              {value === opt && <Check className="size-4 shrink-0" />}
            </Button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
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
        <ScrollArea className="max-h-72 p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "hover:bg-muted hover:text-foreground flex h-auto w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-normal",
              value === "" && "bg-teal-50 text-teal-800 font-medium hover:text-teal-800",
            )}
          >
            <span>Tutti gli enti</span>
            {value === "" && <Check className="size-4" />}
          </Button>
          {filtered.map((opt) => (
            <Button
              key={opt}
              type="button"
              variant="ghost"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                "hover:bg-muted hover:text-foreground flex h-auto w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-normal",
                value === opt && "bg-teal-50 text-teal-800 font-medium hover:text-teal-800",
              )}
            >
              <span className="truncate">{opt}</span>
              {value === opt && <Check className="size-4 shrink-0" />}
            </Button>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground p-3 text-center text-sm">
              Nessun ente trovato
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
