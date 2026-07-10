"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FirmaPerEnteRow } from "@/lib/services/firme-per-ente.service";
import { cn } from "@/lib/utils";

type FirmePerEnteTableProps = {
  columns: ColumnDef<FirmaPerEnteRow>[];
  data: FirmaPerEnteRow[];
  isEmpty: boolean;
};

export function FirmePerEnteTable({
  columns,
  data,
  isEmpty,
}: FirmePerEnteTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[760px]">
        <TableHeader className="bg-muted/50 text-muted-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "h-auto px-3 py-3 font-medium text-muted-foreground whitespace-normal",
                    header.column.id === "rank" && "w-12 text-left",
                    header.column.id === "description" && "text-left",
                    header.column.id === "kind" && "text-left",
                    header.column.id === "firme_signed" && "w-36 text-right",
                    header.column.id === "firme_cancelled" && "w-24 text-right",
                    header.column.id === "firme_rejected" && "w-24 text-right",
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
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
              className="border-b last:border-0 hover:bg-muted/30"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "px-3 py-3 whitespace-normal",
                    (cell.column.id === "firme_signed" ||
                      cell.column.id === "firme_cancelled" ||
                      cell.column.id === "firme_rejected") &&
                      "text-right",
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isEmpty && (
        <p className="text-muted-foreground p-6 text-center text-sm">
          Nessun ente corrisponde alla ricerca.
        </p>
      )}
    </div>
  );
}
