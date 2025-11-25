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
import { SearchIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import AddDelegation from "../add-delegation";
import { TabWrapper } from "@/components/layout/tab-wrapper";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  institutionId: string;
  institutionName: string;
}
export function DelegationsTable<TData, TValue>({
  columns,
  data,
  institutionId,
  institutionName,
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
    <TabWrapper>
      <div className="flex items-center justify-between w-full">
        <div className="inline-flex items-center gap-4">
          <p className="font-medium text-lg">Deleghe PagoPA</p>
          <Badge variant="secondary">{data.length} deleghe totali</Badge>
        </div>

        <div className="inline-flex gap-4 items-center">
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

          <AddDelegation
            institutionId={institutionId}
            institutionName={institutionName}
          />
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
                      className="text-black font-bold h-9"
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
    </TabWrapper>
  );
}
