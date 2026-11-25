"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

const MAX_PENDING_LOGS = 500;
const REFRESH_INTERVAL = 30_000;

// SSE invalidates the view. List and chart are read together, so reconnects,
// duplicate events and rolling time windows cannot double-count the chart.
export function useLiveLogs({
  query,
  paused,
  onRefresh,
}: {
  query: string;
  paused: boolean;
  onRefresh: (automatic: boolean) => Promise<boolean>;
}) {
  const [connection, setConnection] = useState<
    "connecting" | "connected" | "reconnecting"
  >("connecting");
  const [pendingCount, setPendingCount] = useState(0);
  const [overflow, setOverflow] = useState(false);
  const sequence = useRef(0);
  const acknowledged = useRef(0);
  const generation = useRef(0);
  const refreshing = useRef(false);

  async function refresh(automatic = false) {
    if (
      automatic &&
      (paused || refreshing.current || document.visibilityState === "hidden")
    )
      return false;
    const currentGeneration = generation.current;
    const through = sequence.current;
    refreshing.current = true;
    try {
      const success = await onRefresh(automatic);
      if (success && currentGeneration === generation.current) {
        acknowledged.current = Math.max(acknowledged.current, through);
        const remaining = sequence.current - acknowledged.current;
        setPendingCount(Math.min(remaining, MAX_PENDING_LOGS));
        setOverflow(remaining > MAX_PENDING_LOGS);
      }
      return success;
    } finally {
      if (currentGeneration === generation.current) refreshing.current = false;
    }
  }

  const refreshFromStream = useEffectEvent(() => refresh(true));

  useEffect(() => {
    generation.current += 1;
    sequence.current = 0;
    acknowledged.current = 0;
    refreshing.current = false;
    setPendingCount(0);
    setOverflow(false);
    setConnection("connecting");
    const seen = new Set<string>();
    let active = true;
    let lastRefresh = Date.now();
    let notifyTimer: ReturnType<typeof setTimeout> | undefined;
    const source = new EventSource(`/api/monitoring/logs/live${query}`);

    const handleOpen = () => {
      setConnection("connected");
      // Reconcile the initial read/subscription gap as well as reconnections.
      lastRefresh = 0;
    };
    const handleError = () => setConnection("reconnecting");
    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const log: unknown = JSON.parse(event.data);
        if (
          !log ||
          typeof log !== "object" ||
          !("id" in log) ||
          typeof log.id !== "string" ||
          seen.has(log.id)
        )
          return;
        seen.add(log.id);
        if (seen.size > MAX_PENDING_LOGS * 2)
          seen.delete(seen.values().next().value!);
        sequence.current += 1;
        notifyTimer ??= setTimeout(() => {
          const remaining = sequence.current - acknowledged.current;
          setPendingCount(Math.min(remaining, MAX_PENDING_LOGS));
          setOverflow(remaining > MAX_PENDING_LOGS);
          notifyTimer = undefined;
        }, 250);
      } catch {
        // Reconcile via HTTP, avoiding a new log in the same stream.
        lastRefresh = 0;
      }
    };

    source.addEventListener("open", handleOpen);
    source.addEventListener("error", handleError);
    source.addEventListener("message", handleMessage);

    const timer = setInterval(async () => {
      if (
        sequence.current === acknowledged.current &&
        Date.now() - lastRefresh < REFRESH_INTERVAL
      )
        return;
      const success = await refreshFromStream();
      if (active && success) lastRefresh = Date.now();
    }, 2_000);

    return () => {
      active = false;
      generation.current += 1;
      clearInterval(timer);
      clearTimeout(notifyTimer);
      source.close();
    };
    // Effect Events read current props without resubscribing to the stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return { connection, pendingCount, overflow, refresh };
}
