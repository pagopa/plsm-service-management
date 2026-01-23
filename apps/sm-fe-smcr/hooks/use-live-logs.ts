"use client";

import { Log } from "@/lib/services/logs.service";
import React, { useEffect } from "react";

function normalizeLog(
  input: Partial<Log> & { request?: string | null },
): Log | null {
  if (!input) {
    return null;
  }
  if (
    !input.id ||
    !input.timestamp ||
    !input.level ||
    !input.service ||
    !input.message
  ) {
    return null;
  }

  return {
    id: input.id,
    timestamp: input.timestamp,
    level: input.level,
    service: input.service,
    message: input.message,
    requestId: input.requestId ?? input.request ?? undefined,
  };
}

export function useLiveLogs(initialData: Array<Log>) {
  const [data, setData] = React.useState<Array<Log>>(initialData);

  useEffect(() => {
    const eventSource = new EventSource("/api/monitoring/logs/live");

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as Log;
        const log = normalizeLog(payload);
        if (!log) {
          return;
        }

        setData((prev) => [log, ...prev]);
      } catch (error) {
        console.error(error);
      }
    };

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("ping", () => {});

    return () => {
      eventSource.removeEventListener("message", handleMessage);
      eventSource.close();
    };
  }, []);

  return data;
}
