"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface UploadedFile {
  name: string;
  size: number;
  date: string;
}

const LOCAL_STORAGE_KEY = "uploaded-files";

export function UploadedFilesTable() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) setFiles(JSON.parse(stored));
  }, []);

  const columns = useMemo<ColumnDef<UploadedFile>[]>(
    () => [
      { accessorKey: "name", header: "Nome file" },
      {
        accessorKey: "size",
        header: "Dimensione (MB)",
        cell: (info) => (info.getValue<number>() / 1048576).toFixed(2),
      },
      { accessorKey: "date", header: "Data upload" },
    ],
    [],
  );

  const table = useReactTable({
    data: files,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!files.length)
    return (
      <div className="text-gray-500 mt-4">Nessun file caricato di recente.</div>
    );

  return (
    <div className="overflow-x-auto mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50">
      <h2 className="mb-2 text-lg font-bold">File Recenti Caricati</h2>
      <Table className="min-w-full border text-sm bg-gray-200 rounded-xl overflow-hidden">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="border px-4 py-2 bg-gray-100 text-left"
                >
                  {flexRender(
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
            <TableRow key={row.id} className="bg-white">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="border px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
