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
import type { WalletRow } from "@/lib/services/wallet.service";
import { cn } from "@/lib/utils";

type WalletTableProps = {
  columns: ColumnDef<WalletRow>[];
  data: WalletRow[];
  isEmpty: boolean;
};

export function WalletTable({ columns, data, isEmpty }: WalletTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[860px]">
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
                    header.column.id === "descriptorid" && "w-32",
                    header.column.id === "nomeEnte" && "w-72",
                    header.column.id === "state" && "w-44",
                    header.column.id === "createdat" && "w-40",
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
          Nessun servizio corrisponde ai filtri impostati.
        </p>
      )}
    </div>
  );
}
