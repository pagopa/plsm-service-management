"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { Log } from "@/lib/services/logs.service";
import { LogDetailSheet } from "@/components/logs/log-detail-sheet";

interface LogsTableProps {
  columns: ColumnDef<Log>[];
  data: Log[];
}

export function LogsTable({ columns, data }: LogsTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [levels] = useQueryState("level", parseAsArrayOf(parseAsString));
  const [services] = useQueryState("service", parseAsArrayOf(parseAsString));
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnFilters,
    },
  });

  useEffect(() => {
    table.getColumn("level")?.setFilterValue(levels);
  }, [levels, table]);

  useEffect(() => {
    table.getColumn("service")?.setFilterValue(services);
  }, [services, table]);

  const handleOpenChange = (open: boolean) => {
    setDetailOpen(open);
  };

  const handleRowClick = (log: Log) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="h-full min-h-0 overflow-auto">
      <LogDetailSheet
        log={selectedLog}
        open={detailOpen}
        onOpenChange={handleOpenChange}
      />
      <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
        <TableHeader className="bg-neutral-100 [&_tr]:border-b-0">
          {table.getHeaderGroups().map((headerGroup, headerGroupIndex) => (
            <TableRow key={headerGroup.id} className="border-b-0">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="sticky z-10 bg-neutral-100 font-normal text-muted-foreground text-sm px-3 h-9 border-b border-r border-neutral-200"
                    style={{ top: headerGroupIndex * 36 }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody className="[&_tr:last-child>td]:border-b-0">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const log = row.original;
              const isSelected = selectedLog?.id === log.id;

              return (
                <TableRow
                  key={row.id}
                  data-state={isSelected && "selected"}
                  className="border-b-0 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(log)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowClick(log);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-3 h-9 py-0 border-b border-r border-neutral-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </table>
    </div>
  );
}
