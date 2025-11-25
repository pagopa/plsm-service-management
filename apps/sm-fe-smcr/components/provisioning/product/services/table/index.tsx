"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Service } from "@/lib/services/services-messages.service";
import { SearchIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import ExportServices from "../../contract/export-services";
import ServiceSheet from "../service-sheet";

interface DataTableProps<TData, TValue> {
  institution: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ServicesTable<TData, TValue>({
  institution,
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background gap-4">
      <div className="flex items-center justify-between w-full">
        <div className="inline-flex items-center gap-4">
          <p className="font-medium text-lg">Servizi IO</p>
          <Badge variant="secondary">{data.length} servizi totali</Badge>
        </div>

        <div className="inline-flex gap-4 items-center">
          <ExportServices
            institution={institution}
            items={data as Array<Service>}
          />

          <div className="relative">
            <Input
              placeholder="Cerca per nome o ID..."
              value={globalFilter}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="w-80 peer ps-9"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <SearchIcon className="opacity-60 size-3.5" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 border rounded-lg overflow-y-auto overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground font-normal h-9 px-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : (flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          ) as ReactNode)}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <ServiceSheet
                  key={row.id}
                  service={
                    data.find(
                      (s) =>
                        (s as any).id === (row.original as { id: string }).id,
                    ) as Service
                  }
                >
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          ) as ReactNode
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                </ServiceSheet>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <Pagination table={table} itemsLength={data.length} />
      </div>
    </div>
  );
}
