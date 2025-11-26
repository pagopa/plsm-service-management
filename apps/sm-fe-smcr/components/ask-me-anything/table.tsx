"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import { MouseEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (rowData: TData) => void;
}

export function AskMeAnythingTable<TData, TValue>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const allColumns = table.getAllLeafColumns();
  const selectColumnId = "select";
  const hasSelectColumn = allColumns.some(
    (column) => column.id === selectColumnId,
  );
  const selectColumnWidth = 48;
  const nonSelectColumnCount =
    allColumns.filter((column) => column.id !== selectColumnId).length || 1;
  const columnWidth = hasSelectColumn
    ? `calc((100% - ${selectColumnWidth}px) / ${nonSelectColumnCount})`
    : `${100 / (allColumns.length || 1)}%`;

  const getColumnWidth = (columnId: string) =>
    hasSelectColumn && columnId === selectColumnId
      ? `${selectColumnWidth}px`
      : columnWidth;

  const handleRowClick =
    (row: Row<TData>) => (event: MouseEvent<HTMLTableRowElement>) => {
      if (!onRowClick) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, [role=checkbox]")) {
        return;
      }

      onRowClick(row.original);
    };

  return (
    <div className="overflow-hidden">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="[&>th]:border-r [&>th:last-child]:border-0"
            >
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground font-normal"
                    style={{ width: getColumnWidth(header.column.id) }}
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
        <TableBody className="border-b">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="[&>td]:border-r [&>td:last-child]:border-0 cursor-pointer"
                onClick={handleRowClick(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: getColumnWidth(cell.column.id) }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
