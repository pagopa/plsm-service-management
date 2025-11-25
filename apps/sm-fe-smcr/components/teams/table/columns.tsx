"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Team } from "@/lib/services/teams.service";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Team>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "icon",
    header: "Icona",
  },
  {
    accessorKey: "createdAt",
    header: "Data creazione",
    cell: ({ row }) => {
      const date = row.getValue<Date>("createdAt");
      return <div>{new Date(date).toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Data aggiornamento",
    cell: ({ row }) => {
      const date = row.getValue<Date>("updatedAt");
      return <div>{new Date(date).toLocaleDateString()}</div>;
    },
  },
];
