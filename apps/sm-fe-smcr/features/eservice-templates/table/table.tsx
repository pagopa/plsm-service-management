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
import type { EserviceTemplate } from "@/lib/services/eservice-templates.service";
import { cn } from "@/lib/utils";

type EserviceTemplatesTableProps = {
  columns: ColumnDef<EserviceTemplate>[];
  data: EserviceTemplate[];
  isEmpty: boolean;
};

export function EserviceTemplatesTable({
  columns,
  data,
  isEmpty,
}: EserviceTemplatesTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[980px]">
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
                    "h-auto px-3 py-3 text-left font-medium text-muted-foreground whitespace-normal",
                    header.column.id === "id" && "w-32",
                    header.column.id === "intendedTarget" && "w-80",
                    header.column.id === "technology" && "w-32",
                    header.column.id === "mode" && "w-36",
                    header.column.id === "flags" && "w-44",
                    header.column.id === "download" && "w-28 text-center",
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
                  className="px-3 py-3 whitespace-normal"
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
          Nessun template corrisponde ai filtri impostati.
        </p>
      )}
    </div>
  );
}
