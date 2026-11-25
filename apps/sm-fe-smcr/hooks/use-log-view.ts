"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOGS_PAGE_SIZE,
  MAX_LOADED_LOGS,
  type LogView,
} from "@/lib/log-filters";
import type { Log } from "@/lib/services/logs.service";

export function useLogView(
  query: string,
  initialQuery: string,
  initialView: LogView | null,
) {
  const [snapshot, setSnapshot] = useState({
    query: initialQuery,
    view: initialView,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const request = useRef<{
    controller: AbortController;
    automatic: boolean;
  } | null>(null);
  const moreRequest = useRef<AbortController | null>(null);
  const firstRender = useRef(true);
  const view = snapshot.query === query ? snapshot.view : null;

  const refresh = useCallback(
    async (automatic = false) => {
      if (automatic && request.current) return false;
      request.current?.controller.abort();
      moreRequest.current?.abort();
      moreRequest.current = null;
      setLoadingMore(false);
      const controller = new AbortController();
      request.current = { controller, automatic };
      if (!automatic) setRefreshing(true);
      if (!automatic) setError(null);
      setMoreError(null);

      try {
        const response = await fetch(`/api/monitoring/logs/view${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error("Impossibile aggiornare i log. Riprova.");
        const next = (await response.json()) as LogView;
        if (controller.signal.aborted) return false;
        setError(null);
        setSnapshot({ query, view: next });
        return true;
      } catch {
        if (!controller.signal.aborted)
          setError(
            "Impossibile aggiornare i log. Controlla la connessione e riprova.",
          );
        return false;
      } finally {
        if (request.current?.controller === controller) {
          request.current = null;
          setRefreshing(false);
        }
      }
    },
    [query],
  );

  useEffect(() => {
    const hasInitialView =
      firstRender.current && query === initialQuery && initialView;
    firstRender.current = false;
    setMoreError(null);
    setLoadingMore(false);
    if (!hasInitialView) void refresh();
    return () => {
      request.current?.controller.abort();
      request.current = null;
      moreRequest.current?.abort();
      moreRequest.current = null;
    };
  }, [query, initialQuery, initialView, refresh]);

  const cancelAutomaticRefresh = useCallback(() => {
    if (request.current?.automatic) {
      request.current.controller.abort();
      request.current = null;
    }
  }, []);

  async function loadMore() {
    const oldest = view?.logs.at(-1);
    if (
      !view ||
      !oldest ||
      moreRequest.current ||
      view.logs.length >= MAX_LOADED_LOGS
    )
      return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setMoreError(null);
    const limit = Math.min(LOGS_PAGE_SIZE, MAX_LOADED_LOGS - view.logs.length);
    const params = new URLSearchParams(query);
    params.set("limit", String(limit + 1));
    params.set("before", oldest.timestamp);
    params.set("beforeId", oldest.id);
    params.set("until", view.until);

    try {
      const response = await fetch(`/api/monitoring/logs?${params}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Impossibile caricare altri log.");
      const logs = (await response.json()) as Log[];
      if (controller.signal.aborted) return;
      setSnapshot((current) => {
        if (current.query !== query || !current.view) return current;
        const seen = new Set(current.view.logs.map((log) => log.id));
        return {
          ...current,
          view: {
            ...current.view,
            logs: [
              ...current.view.logs,
              ...logs.slice(0, limit).filter((log) => !seen.has(log.id)),
            ],
            hasMore: logs.length > limit,
          },
        };
      });
    } catch {
      if (!controller.signal.aborted)
        setMoreError("Impossibile caricare i log precedenti. Riprova.");
    } finally {
      if (moreRequest.current === controller) {
        moreRequest.current = null;
        setLoadingMore(false);
      }
    }
  }

  return {
    view,
    refreshing,
    error,
    loadingMore,
    moreError,
    refresh,
    loadMore,
    cancelAutomaticRefresh,
  };
}
