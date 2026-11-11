"use client";

import * as React from "react";
import { formatLogTimestamp } from "@/lib/log-dates";
import { compactLogFields } from "@/lib/logger/logger.utils";
import type { Log, LogDetail, LogLevel } from "@/lib/services/logs.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardRow } from "@/components/core/card-row";
import { Pillow } from "@/components/ui/pillow";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  AlertTriangleIcon,
  InfoIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  RouteIcon,
} from "lucide-react";

type Props = {
  log: Log | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getPillowVariant(level: LogLevel) {
  switch (level) {
    case "DEBUG":
      return "debug";
    case "INFO":
      return "info";
    case "WARN":
      return "warn";
    case "ERROR":
      return "error";
    case "FATAL":
      return "fatal";
    default:
      return "default";
  }
}

function getLevelBadge(level: LogLevel) {
  const colorClass = {
    DEBUG: "text-neutral-500",
    INFO: "text-blue-500",
    WARN: "text-amber-500",
    ERROR: "text-red-500",
    FATAL: "text-violet-600",
  }[level];

  return (
    <Badge
      variant="outline"
      className={cn("font-mono font-normal", colorClass)}
    >
      [{level}]
    </Badge>
  );
}

function getServiceBadge(service: string) {
  switch (service) {
    case "SMCR":
      return (
        <Badge variant="outline" className="bg-secondary font-normal">
          <LayoutDashboardIcon className="opacity-60" />
          SMCR
        </Badge>
      );
    default:
      return <Badge>{service}</Badge>;
  }
}

export function LogDetailSheet({ log, open, onOpenChange }: Props) {
  const [detail, setDetail] = React.useState<LogDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setDetail(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    if (!log?.id) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadDetail = async () => {
      setIsLoading(true);
      setLoadError(null);
      setDetail(null);

      try {
        const response = await fetch(
          `/api/monitoring/logs/${encodeURIComponent(log.id)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message =
            payload?.message ?? "Errore nel caricamento del dettaglio.";
          throw new Error(message);
        }

        const data = (await response.json()) as LogDetail;
        if (isActive) {
          setDetail(data);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (isActive) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Errore nel caricamento del dettaglio.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [open, log?.id]);

  if (!log) {
    return null;
  }

  const request = compactLogFields({
    method: detail?.request?.method,
    path: detail?.request?.path,
    statusCode: detail?.request?.statusCode,
  });
  const error = compactLogFields(detail?.error);
  const info = compactLogFields({
    event: detail?.info?.event,
    metadata: detail?.info?.metadata,
  });
  const infoPayload = info?.metadata
    ? JSON.stringify(info.metadata, null, 2)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-2">
            <span className="mt-1">
              <Pillow variant={getPillowVariant(log.level)} />
            </span>
            <span className="text-base leading-snug break-words">
              {log.message}
            </span>
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {formatLogTimestamp(log.timestamp)} - {log.id}
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {getLevelBadge(log.level)}
            {getServiceBadge(log.service)}
            {log.requestId ? (
              <Badge
                variant="outline"
                className="font-mono font-normal bg-muted"
              >
                {log.requestId}
              </Badge>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-3.5" />
              Caricamento dettaglio...
            </div>
          ) : null}

          {loadError ? (
            <div className="text-sm text-red-500">{loadError}</div>
          ) : null}

          {request ? (
            <div className="flex flex-col gap-2">
              <h2 className="font-medium">Richiesta</h2>
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 gap-4 flex flex-col w-full">
                {request.method ? (
                  <CardRow label="Metodo" value={request.method}>
                    <RouteIcon />
                  </CardRow>
                ) : null}
                {request.path ? (
                  <CardRow label="Path" value={request.path}>
                    <RouteIcon />
                  </CardRow>
                ) : null}
                {request.statusCode !== undefined &&
                request.statusCode !== null ? (
                  <CardRow label="Status" value={String(request.statusCode)}>
                    <ActivityIcon />
                  </CardRow>
                ) : null}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2">
                <AlertTriangleIcon className="size-4 text-red-500" />
                <h2 className="font-medium">Errore</h2>
              </div>
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 gap-4 flex flex-col w-full">
                {error.name ? (
                  <CardRow label="Tipo" value={error.name}>
                    <AlertTriangleIcon />
                  </CardRow>
                ) : null}
                {error.message ? (
                  <CardRow label="Messaggio tecnico" value={error.message}>
                    <MessageSquareIcon />
                  </CardRow>
                ) : null}
                {error.stack ? (
                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Stack
                    </summary>
                    <pre className="mt-2 text-xs font-mono whitespace-pre-wrap break-words bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-neutral-700">
                      {error.stack}
                    </pre>
                  </details>
                ) : null}
              </div>
            </div>
          ) : null}

          {info ? (
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2">
                <InfoIcon className="size-4 text-blue-500" />
                <h2 className="font-medium">Contesto</h2>
              </div>
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 gap-4 flex flex-col w-full">
                {info.event ? (
                  <CardRow label="Evento" value={info.event}>
                    <InfoIcon />
                  </CardRow>
                ) : null}
                {infoPayload ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Metadata</p>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-neutral-700">
                      {infoPayload}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex flex-row justify-end">
          <SheetClose asChild>
            <Button variant="outline">Chiudi</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
