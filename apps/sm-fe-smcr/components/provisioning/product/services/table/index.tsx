"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { TabWrapper } from "@/components/layout/tab-wrapper";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      columnFilters,
    },
  });
  const visibilityFilter = table.getColumn("isVisible")?.getFilterValue();

  return (
    <TabWrapper>
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="inline-flex items-center gap-4">
          <p className="font-medium text-lg">Servizi IO</p>
          <Badge variant="secondary">{data.length} servizi totali</Badge>
        </div>

        <div className="inline-flex flex-wrap gap-4 items-center">
          <ExportServices
            institution={institution}
            items={data as Array<Service>}
          />

          <Select
            value={
              visibilityFilter === undefined
                ? "all"
                : visibilityFilter
                  ? "visible"
                  : "hidden"
            }
            onValueChange={(value) => {
              table
                .getColumn("isVisible")
                ?.setFilterValue(
                  value === "all" ? undefined : value === "visible",
                );
              table.resetPageIndex();
            }}
          >
            <SelectTrigger className="w-44" aria-label="Visibilità dei servizi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="visible">Visibili</SelectItem>
              <SelectItem value="hidden">Non visibili</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              placeholder="Cerca per nome o ID..."
              value={globalFilter}
              onChange={(event) => {
                table.setGlobalFilter(event.target.value);
                table.resetPageIndex();
              }}
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
        <Pagination
          table={table}
          itemsLength={table.getFilteredRowModel().rows.length}
        />
      </div>
    </TabWrapper>
  );
}
