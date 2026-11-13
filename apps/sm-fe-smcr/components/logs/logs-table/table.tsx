"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Log } from "@/lib/services/logs.service";
import { LogDetailSheet } from "@/components/logs/log-detail-sheet";
import { getLogColumns } from "./columns";

type Props = {
  data: Log[];
  filtered: boolean;
  onReset: () => void;
  onInspect: () => void;
};

export function LogsTable({ data, filtered, onReset, onInspect }: Props) {
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const region = useRef<HTMLDivElement | null>(null);

  const openLog = useCallback(
    (log: Log, element: HTMLElement) => {
      trigger.current = element;
      onInspect();
      setSelectedLog(log);
      setOpen(true);
    },
    [onInspect],
  );

  // Stable cell renderers preserve DOM/focus when live data or the sheet changes.
  const columns = useMemo(() => getLogColumns(openLog), [openLog]);
  const table = useReactTable({
    data,
    columns,
    getRowId: (log) => log.id,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <LogDetailSheet
        log={selectedLog}
        open={open}
        onOpenChange={setOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = trigger.current?.isConnected
            ? trigger.current
            : (region.current?.querySelector<HTMLElement>(
                `[data-log-id="${CSS.escape(selectedLog?.id ?? "")}"]`,
              ) ?? region.current);
          target?.focus({ preventScroll: true });
        }}
      />
      <div
        ref={region}
        role="region"
        aria-label="Elenco dei log"
        tabIndex={0}
        className="relative h-full min-h-0 overflow-auto overscroll-contain rounded-b-xl outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-foreground"
        onScroll={(event) => {
          if (
            event.currentTarget.scrollTop > 16 ||
            event.currentTarget.scrollLeft > 16
          )
            onInspect();
        }}
        onFocusCapture={(event) => {
          if ((event.target as HTMLElement).closest("[data-log-trigger]"))
            onInspect();
        }}
      >
        {data.length ? (
          <table className="relative w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-sm">
            <caption className="sr-only">
              Log dal più recente. Apri un messaggio per consultarne il
              dettaglio.
            </caption>
            <colgroup>
              {columns.map((column, index) => (
                <col
                  key={index}
                  style={column.size ? { width: column.size } : undefined}
                />
              ))}
            </colgroup>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      scope="col"
                      className="sticky top-0 z-10 h-9 border-b bg-muted px-3 text-xs font-medium text-foreground/75"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    open && selectedLog?.id === row.id ? "selected" : undefined
                  }
                  className="cursor-pointer"
                  onClick={(event) => {
                    if (
                      (event.target as HTMLElement).closest("button") ||
                      window.getSelection()?.toString()
                    )
                      return;
                    const button =
                      event.currentTarget.querySelector<HTMLElement>(
                        "[data-log-trigger]",
                      );
                    if (button) openLog(row.original, button);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border-b border-border/60 px-3 py-1 align-middle whitespace-normal"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </table>
        ) : (
          <div className="px-4 py-10 text-center text-sm" role="status">
            <p className="font-medium">
              {filtered
                ? "Nessun log corrisponde ai filtri"
                : "Nessun log nel periodo selezionato"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {filtered
                ? "Modifica la ricerca o rimuovi un filtro."
                : "Prova a selezionare un periodo più ampio."}
            </p>
            {filtered ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onReset}
              >
                Azzera filtri
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
