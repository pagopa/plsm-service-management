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
import type { OnboardedInstitution } from "@/lib/services/onboarded-institutions.service";
import { cn } from "@/lib/utils";

type OnboardedInstitutionsTableProps = {
  columns: ColumnDef<OnboardedInstitution>[];
  data: OnboardedInstitution[];
  isEmpty: boolean;
};

export function OnboardedInstitutionsTable({
  columns,
  data,
  isEmpty,
}: OnboardedInstitutionsTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => `${row.giorno_attivazione}|${row.prodotto}|${row.id_ente}`,
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
                    "h-auto px-3 py-3 text-left font-medium whitespace-normal text-muted-foreground",
                    header.column.id === "giorno_attivazione" && "w-40",
                    header.column.id === "prodotto" && "w-48",
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
          Nessun onboarding corrisponde ai filtri.
        </p>
      )}
    </div>
  );
}
