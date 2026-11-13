"use client";

import { TabWrapper } from "@/components/layout/tab-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AggregateDelegation } from "@/lib/services/delegations.service";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";

// 11 digits (P.IVA / CF ente) or 16 alphanumeric chars (CF persona fisica).
const TAX_CODE_REGEX = /^(\d{11}|[A-Z0-9]{16})$/;

const columns: ColumnDef<AggregateDelegation>[] = [
  { accessorKey: "taxCode", header: "Codice Fiscale" },
  { accessorKey: "institutionName", header: "Denominazione" },
  { accessorKey: "institutionType", header: "Tipologia ente" },
  {
    accessorKey: "status",
    header: "Stato",
    cell: ({ row }) => {
      const status = row.original.status;

      if (status === "ACTIVE") {
        return <Badge variant="outline-success">Attiva</Badge>;
      }
      if (status === "SUSPENDED") {
        return <Badge variant="outline-warning">Sospesa</Badge>;
      }
      if (status === "DELETED") {
        return <Badge variant="outline-destructive">Eliminata</Badge>;
      }
      return status ? <Badge variant="outline">{status}</Badge> : "-";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Data creazione",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      return createdAt
        ? new Date(createdAt).toLocaleDateString("it-IT", {
            timeZone: "Europe/Rome",
          })
        : "-";
    },
  },
];

type Props = {
  data: Array<AggregateDelegation>;
};

export function AggregatesTable({ data }: Props) {
  const [input, setInput] = useState("");
  const [searchedTaxCode, setSearchedTaxCode] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const filteredData = useMemo(
    () =>
      searchedTaxCode
        ? data.filter((item) => item.taxCode?.toUpperCase() === searchedTaxCode)
        : data,
    [data, searchedTaxCode],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim().toUpperCase();

    if (!value) {
      resetSearch();
      return;
    }

    if (!TAX_CODE_REGEX.test(value)) {
      setValidationError(
        "Formato non valido: inserire 11 cifre numeriche o 16 caratteri alfanumerici.",
      );
      return;
    }

    setValidationError(null);
    setSearchedTaxCode(value);
    table.setPageIndex(0);
  }

  function resetSearch() {
    setValidationError(null);
    setSearchedTaxCode(null);
    table.setPageIndex(0);
  }

  function handleChange(value: string) {
    setInput(value);
    if (!value.trim()) {
      resetSearch();
    }
  }

  const isEmptySearch = searchedTaxCode !== null && filteredData.length === 0;

  return (
    <TabWrapper>
      <div className="flex items-start justify-between w-full gap-4">
        <div className="inline-flex items-center gap-4">
          <p className="font-medium text-lg">Enti Aggregati</p>
          <Badge variant="secondary">{data.length} enti aggregati</Badge>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-1"
          noValidate
        >
          <div className="inline-flex gap-2 items-center">
            <div className="relative">
              <Input
                placeholder="Cerca per Codice Fiscale..."
                value={input}
                onChange={(event) => handleChange(event.target.value)}
                aria-invalid={validationError ? true : undefined}
                aria-describedby="aggregates-search-error"
                maxLength={16}
                className="w-80 peer ps-9"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <SearchIcon
                  className="opacity-60 size-3.5"
                  aria-hidden="true"
                />
              </div>
            </div>
            <Button type="submit">Cerca</Button>
          </div>
          {validationError && (
            <p
              id="aggregates-search-error"
              className="text-xs text-destructive"
            >
              {validationError}
            </p>
          )}
        </form>
      </div>

      <div className="min-h-0 border rounded-lg overflow-y-auto overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
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
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  className="h-24 text-center text-muted-foreground"
                >
                  {isEmptySearch
                    ? `Nessun ente aggregato associato al Codice Fiscale ${searchedTaxCode}.`
                    : "Nessun ente aggregato presente."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <Pagination table={table} itemsLength={filteredData.length} />
      </div>
    </TabWrapper>
  );
}
