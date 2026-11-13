"use client";

import { useCallback, useState } from "react";
import { useQueryStates } from "nuqs";
import {
  CircleIcon,
  PauseIcon,
  PlayIcon,
  RefreshCcwIcon,
  WifiOffIcon,
} from "lucide-react";
import VolumeChart from "@/components/logs/volume-chart";
import { LogsTable } from "@/components/logs/logs-table/table";
import { LogsHeader } from "@/components/logs/logs-header";
import { Button } from "@/components/ui/button";
import { useLiveLogs } from "@/hooks/use-live-logs";
import { useLogView } from "@/hooks/use-log-view";
import { formatLogTimestamp } from "@/lib/log-dates";
import {
  logFilterParsers,
  serializeLogFilters,
  LOG_RANGES,
  MAX_LOADED_LOGS,
  MAX_LOG_SEARCH_LENGTH,
  type LogView,
} from "@/lib/log-filters";

type Props = { initialView: LogView | null; initialQuery: string };

export function LogsDashboard({ initialView, initialQuery }: Props) {
  const [queryState, setFilters] = useQueryStates(logFilterParsers, {
    history: "replace",
    shallow: true,
  });
  const filters = {
    ...queryState,
    q: queryState.q.trim().slice(0, MAX_LOG_SEARCH_LENGTH),
  };
  const query = serializeLogFilters(filters);
  const [paused, setPaused] = useState(false);
  const [scrollReset, setScrollReset] = useState(0);
  const source = useLogView(query, initialQuery, initialView);
  const live = useLiveLogs({ query, paused, onRefresh: source.refresh });
  const { view } = source;
  const filtered = Boolean(
    filters.q || filters.level.length || filters.service.length,
  );
  const total =
    view?.volume.reduce(
      (sum, row) =>
        sum + row.debug + row.info + row.warn + row.error + row.fatal,
      0,
    ) ?? 0;
  const liveLabel = paused
    ? "In pausa"
    : live.connection === "connected"
      ? "Live"
      : live.connection === "connecting"
        ? "Connessione…"
        : "Riconnessione…";

  const { cancelAutomaticRefresh } = source;
  const pause = useCallback(() => {
    cancelAutomaticRefresh();
    setPaused(true);
  }, [cancelAutomaticRefresh]);
  async function refresh() {
    if (await live.refresh()) setScrollReset((value) => value + 1);
  }
  async function resume() {
    if (await live.refresh()) {
      setScrollReset((value) => value + 1);
      setPaused(false);
    }
  }
  function resetFilters() {
    void setFilters({ q: null, level: null, service: null });
  }

  return (
    <>
      <LogsHeader
        filters={filters}
        onChange={(patch) => {
          void setFilters(patch);
        }}
        onReset={resetFilters}
      >
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          {paused ? (
            <PauseIcon aria-hidden="true" className="size-3" />
          ) : live.connection === "reconnecting" ? (
            <WifiOffIcon aria-hidden="true" className="size-3" />
          ) : (
            <CircleIcon
              aria-hidden="true"
              className={`size-2 ${live.connection === "connected" ? "fill-emerald-600 text-emerald-600" : "fill-current"}`}
            />
          )}
          {liveLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={paused ? resume : pause}
          disabled={source.refreshing}
          aria-label={
            paused
              ? "Riprendi aggiornamento live"
              : "Metti in pausa aggiornamento live"
          }
        >
          {paused ? (
            <PlayIcon aria-hidden="true" />
          ) : (
            <PauseIcon aria-hidden="true" />
          )}
          {paused ? "Riprendi" : "Pausa"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={refresh}
          disabled={source.refreshing}
          aria-label="Aggiorna log"
          title="Aggiorna log"
        >
          <RefreshCcwIcon
            aria-hidden="true"
            className={source.refreshing ? "motion-safe:animate-spin" : ""}
          />
        </Button>
      </LogsHeader>

      {source.error ? (
        <div
          role="alert"
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <span>{source.error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={source.refreshing}
          >
            Riprova
          </Button>
        </div>
      ) : null}

      {paused && view ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
          <p>Vista ferma al {formatLogTimestamp(view.until)} UTC.</p>
          {live.pendingCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={resume}
              disabled={source.refreshing}
            >
              {live.pendingCount}
              {live.overflow ? "+" : ""}{" "}
              {live.pendingCount === 1 ? "nuovo log" : "nuovi log"}
            </Button>
          ) : (
            <span>Riprendi il live per ricevere gli aggiornamenti.</span>
          )}
        </div>
      ) : null}

      {view ? <VolumeChart data={view.volume} range={filters.range} /> : null}

      <section
        aria-label="Risultati dei log"
        aria-busy={source.refreshing}
        className="flex min-h-48 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-3 py-2 text-xs text-muted-foreground">
          <span>{LOG_RANGES[filters.range].label} · Dal più recente</span>
          <span className="tabular-nums" role="status">
            {source.refreshing
              ? "Aggiornamento…"
              : view
                ? `${view.logs.length.toLocaleString("it-IT")} di ${total.toLocaleString("it-IT")} log`
                : ""}
          </span>
          <p className="w-full sm:hidden">
            Scorri orizzontalmente per vedere tutte le colonne.
          </p>
        </div>
        <div className="min-h-0 flex-1">
          {view ? (
            <LogsTable
              key={`${query}:${scrollReset}`}
              data={view.logs}
              filtered={filtered}
              onReset={resetFilters}
              onInspect={pause}
            />
          ) : (
            <div
              className="p-8 text-center text-sm text-muted-foreground"
              role="status"
            >
              {source.error
                ? "I log non sono disponibili. Usa Riprova per ricaricarli."
                : "Caricamento log…"}
            </div>
          )}
        </div>
        {view && (view.hasMore || source.moreError) ? (
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t px-3 py-2">
            {source.moreError ? (
              <p role="alert" className="text-sm">
                {source.moreError}
              </p>
            ) : null}
            {view.logs.length >= MAX_LOADED_LOGS ? (
              <p className="text-center text-xs text-muted-foreground">
                Hai caricato {MAX_LOADED_LOGS.toLocaleString("it-IT")} log.
                Restringi il periodo o usa la ricerca per trovare altri eventi.
              </p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={source.loadingMore || source.refreshing}
                onClick={() => {
                  pause();
                  void source.loadMore();
                }}
              >
                {source.loadingMore
                  ? "Caricamento…"
                  : source.moreError
                    ? "Riprova"
                    : "Carica log precedenti"}
              </Button>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
}
