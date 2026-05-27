"use client";

import dayjs from "dayjs";
import React from "react";
import VolumeChart from "@/components/logs/volume-chart";
import { columns } from "@/components/logs/logs-table/columns";
import { LogsTable } from "@/components/logs/logs-table/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveLogs } from "@/hooks/use-live-logs";
import clientLogger from "@/lib/logger/logger.client";
import type { Log, LogLevel, LogVolume } from "@/lib/services/logs.service";

type Props = {
  initialData: Array<Log>;
  initialVolume: Array<LogVolume>;
};

const LOGS_PAGE_SIZE = 100;

const LOG_VOLUME_LEVEL_KEYS: Record<LogLevel, keyof Omit<LogVolume, "date">> = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

function incrementLogVolume(
  currentVolume: Array<LogVolume>,
  log: Log,
): Array<LogVolume> {
  const timestamp = dayjs(log.timestamp);
  if (!timestamp.isValid()) {
    return currentVolume;
  }

  const day = timestamp.format("YYYY-MM-DD");
  const levelKey = LOG_VOLUME_LEVEL_KEYS[log.level];
  let updated = false;
  const nextVolume = currentVolume.map((item) => {
    if (item.date !== day) {
      return item;
    }

    updated = true;

    return {
      ...item,
      [levelKey]: item[levelKey] + 1,
    };
  });

  return updated ? nextVolume : currentVolume;
}

export function LogsDashboard({ initialData, initialVolume }: Props) {
  const [volume, setVolume] = React.useState(initialVolume);
  const [hasMore, setHasMore] = React.useState(
    initialData.length === LOGS_PAGE_SIZE,
  );
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const { data, appendLogs } = useLiveLogs(initialData, (log) => {
    setVolume((currentVolume) => incrementLogVolume(currentVolume, log));
  });

  const handleLoadMore = async () => {
    const oldestLog = data[data.length - 1];
    if (!oldestLog || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/monitoring/logs?limit=${LOGS_PAGE_SIZE}&before=${encodeURIComponent(oldestLog.timestamp)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load older logs");
      }

      const logs = (await response.json()) as Array<Log>;
      appendLogs(logs);
      setHasMore(logs.length === LOGS_PAGE_SIZE);
    } catch (error) {
      void clientLogger.error({ error }, "Failed to load older logs");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <>
      <VolumeChart data={volume} />

      <Card className="p-0 gap-0 flex flex-col flex-1 min-h-0 min-w-0 w-full max-w-full overflow-hidden">
        <CardHeader className="px-3 py-3 border-b border-neutral-200 pb-3!">
          <CardTitle>Logs</CardTitle>
          <CardDescription>
            Sorted by newest first • Click to inspect
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0">
          <LogsTable data={data} columns={columns} />
        </CardContent>

        {hasMore && (
          <CardFooter className="border-t border-neutral-200 px-3 py-2 justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoadingMore}
              onClick={handleLoadMore}
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
