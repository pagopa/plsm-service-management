"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangleIcon, InfoIcon, RouteIcon } from "lucide-react";
import { formatLogTimestamp } from "@/lib/log-dates";
import { compactLogFields } from "@/lib/logger/logger.utils";
import type { Log, LogDetail } from "@/lib/services/logs.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CopyLogValue } from "./copy-log-value";
import { LogLevelBadge, LogServiceBadge } from "./log-badges";

type Props = {
  log: Log | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
};

export function LogDetailSheet({
  log,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: Props) {
  const [result, setResult] = useState<{
    id: string;
    detail: LogDetail | null;
    error: string | null;
    loading: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open || !log?.id) return;
    const id = log.id;
    const controller = new AbortController();
    setResult({ id, detail: null, error: null, loading: true });
    async function load() {
      try {
        const response = await fetch(
          `/api/monitoring/logs/${encodeURIComponent(id)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok)
          throw new Error(
            response.status === 404
              ? "Questo log non è più disponibile."
              : "Impossibile caricare il dettaglio.",
          );
        const detail = (await response.json()) as LogDetail;
        if (!controller.signal.aborted)
          setResult({ id, detail, error: null, loading: false });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            id,
            detail: null,
            error:
              error instanceof Error
                ? error.message
                : "Impossibile caricare il dettaglio.",
            loading: false,
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [open, log?.id, attempt]);

  if (!log) return null;
  const current = result?.id === log.id ? result : null;
  const detail = current?.detail;
  const error = compactLogFields(detail?.error);
  const request = compactLogFields({
    method: detail?.request?.method,
    path: detail?.request?.path,
    statusCode: detail?.request?.statusCode,
  });
  const info = compactLogFields(detail?.info);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        closeLabel="Chiudi dettaglio"
        onCloseAutoFocus={onCloseAutoFocus}
        className="w-full gap-0 sm:max-w-xl motion-reduce:animate-none motion-reduce:transition-none data-[state=open]:duration-200 data-[state=closed]:duration-150"
      >
        <SheetHeader className="shrink-0 border-b pr-12">
          <SheetTitle>Dettaglio log</SheetTitle>
          <SheetDescription className="font-mono text-xs tabular-nums">
            <time dateTime={log.timestamp}>
              {formatLogTimestamp(log.timestamp)} UTC
            </time>
          </SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <LogLevelBadge level={log.level} />
            <LogServiceBadge service={log.service} />
          </div>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4">
          <section aria-label="Messaggio" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Messaggio</h2>
              <CopyLogValue label="Copia messaggio" value={log.message} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">
              {log.message}
            </p>
          </section>
          {!current || current.loading ? (
            <div
              role="status"
              className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
            >
              Caricamento dettaglio…
            </div>
          ) : null}
          {current?.error ? (
            <div
              role="alert"
              className="space-y-2 rounded-lg border p-3 text-sm"
            >
              <p>{current.error} Puoi riprovare il caricamento.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Riprova
              </Button>
            </div>
          ) : null}
          {error ? (
            <DetailSection
              title="Errore"
              icon={
                <AlertTriangleIcon
                  className="size-4 text-destructive"
                  aria-hidden="true"
                />
              }
            >
              <dl className="space-y-3">
                {error.name ? (
                  <DetailField label="Tipo" value={error.name} />
                ) : null}
                {error.message ? (
                  <DetailField
                    label="Messaggio tecnico"
                    value={error.message}
                  />
                ) : null}
              </dl>
              {error.stack ? (
                <CodeDisclosure
                  label="Stack"
                  value={error.stack}
                  copyLabel="Copia stack"
                />
              ) : null}
            </DetailSection>
          ) : null}
          {request ? (
            <DetailSection
              title="Richiesta"
              icon={<RouteIcon className="size-4" aria-hidden="true" />}
            >
              <div className="flex flex-wrap items-start gap-2 font-mono text-xs">
                {request.method ? (
                  <Badge variant="outline" className="font-mono">
                    {request.method}
                  </Badge>
                ) : null}
                {request.path ? (
                  <code className="min-w-0 flex-1 py-0.5 leading-relaxed wrap-anywhere">
                    {request.path}
                  </code>
                ) : null}
                {request.statusCode != null ? (
                  <Badge
                    variant="outline"
                    className="font-mono"
                    aria-label={`Stato HTTP ${request.statusCode}`}
                  >
                    {request.statusCode}
                  </Badge>
                ) : null}
              </div>
            </DetailSection>
          ) : null}
          {info ? (
            <DetailSection
              title="Contesto"
              icon={<InfoIcon className="size-4" aria-hidden="true" />}
            >
              {info.event ? (
                <dl>
                  <DetailField label="Evento" value={info.event} />
                </dl>
              ) : null}
              {info.metadata ? (
                <dl className="space-y-3">
                  {Object.entries(info.metadata).map(([key, value]) =>
                    value !== null && typeof value === "object" ? (
                      <div key={key}>
                        <dt className="sr-only">{key}</dt>
                        <dd>
                          <CodeDisclosure
                            label={key}
                            value={value}
                            copyLabel={`Copia ${key}`}
                          />
                        </dd>
                      </div>
                    ) : (
                      <DetailField
                        key={key}
                        label={key}
                        value={value === "" ? '""' : String(value)}
                      />
                    ),
                  )}
                </dl>
              ) : null}
            </DetailSection>
          ) : null}
          <section className="space-y-2" aria-label="Riferimenti">
            <h2 className="text-sm font-medium">Riferimenti</h2>
            <dl className="space-y-3">
              <DetailField
                label="ID log"
                value={log.id}
                copyLabel="Copia ID log"
              />
              {log.requestId ? (
                <DetailField
                  label="ID richiesta"
                  value={log.requestId}
                  copyLabel="Copia ID richiesta"
                />
              ) : null}
            </dl>
          </section>
        </div>
        <SheetFooter className="shrink-0 border-t">
          <SheetClose asChild>
            <Button variant="outline">Chiudi</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2" aria-label={title}>
      <h2 className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </h2>
      <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
        {children}
      </div>
    </section>
  );
}

function DetailField({
  label,
  value,
  copyLabel,
}: {
  label: string;
  value: string;
  copyLabel?: string;
}) {
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] sm:gap-3">
      <dt className="py-1 text-xs text-muted-foreground wrap-anywhere">
        {label}
      </dt>
      <dd className="flex min-w-0 items-start gap-1 text-sm">
        <span
          className={`min-w-0 flex-1 py-0.5 whitespace-pre-wrap wrap-anywhere ${copyLabel ? "font-mono text-xs leading-relaxed" : ""}`}
        >
          {value}
        </span>
        {copyLabel ? <CopyLogValue label={copyLabel} value={value} /> : null}
      </dd>
    </div>
  );
}

function CodeDisclosure({
  label,
  value,
  copyLabel,
}: {
  label: string;
  value: unknown;
  copyLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = expanded
    ? typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2)
    : "";
  return (
    <details
      onToggle={(event) => setExpanded(event.currentTarget.open)}
      className="min-w-0"
    >
      <summary className="cursor-pointer rounded-sm text-sm wrap-anywhere outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground">
        {label}
      </summary>
      {expanded ? (
        <div className="mt-2 min-w-0 rounded-md border bg-background p-2">
          <div className="flex justify-end">
            <CopyLogValue label={copyLabel} value={content ?? "null"} />
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed wrap-anywhere">
            {content}
          </pre>
        </div>
      ) : null}
    </details>
  );
}
