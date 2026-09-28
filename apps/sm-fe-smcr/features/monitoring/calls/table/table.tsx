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
import type { MonitoringCall } from "@/lib/services/calls.schema";
import { cn } from "@/lib/utils";

type CallsTableProps = {
  columns: ColumnDef<MonitoringCall>[];
  data: MonitoringCall[];
  isEmpty: boolean;
};

export function CallsTable({ columns, data, isEmpty }: CallsTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-240">
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
                    "text-muted-foreground h-auto px-3 py-3 text-left font-medium whitespace-normal",
                    header.column.id === "title" && "w-64",
                    header.column.id === "institutionName" && "w-72",
                    header.column.id === "productId" && "w-40",
                    header.column.id === "callDate" && "w-40",
                    header.column.id === "link" && "w-20 text-center",
                    header.column.id === "crmActivityId" && "w-36",
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
              className="hover:bg-muted/30 border-b last:border-0"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-3 py-3 whitespace-normal">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isEmpty && (
        <p className="text-muted-foreground p-6 text-center text-sm">
          Nessuna call corrisponde ai filtri impostati.
        </p>
      )}
    </div>
  );
}
