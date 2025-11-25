"use client";

import { Badge } from "@/components/ui/badge";
import { Service } from "@/lib/services/services-messages.service";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: "id",
    header: "ID",
    enableGlobalFilter: true,
  },
  {
    accessorKey: "name",
    header: "Nome",
    enableGlobalFilter: true,
  },
  {
    accessorKey: "scope",
    header: "Scope",
    cell: ({ row }) => {
      const value = row.original.metadata.scope;

      if (value === "LOCAL") {
        return <Badge variant="outline-warning">{value}</Badge>;
      }

      if (value === "NATIONAL") {
        return <Badge variant="outline-destructive">{value}</Badge>;
      }

      return <Badge variant="outline">{value}</Badge>;
    },
  },
  {
    accessorKey: "topic",
    header: "Topic",
    cell: ({ row }) => {
      const value = row.original.topic;

      return <p>{value || "-"}</p>;
    },
  },
  {
    accessorKey: "isVisible",
    header: "Visibilità",
    cell: ({ row }) => {
      const isVisible = row.original.isVisible;

      return (
        <div className="flex items-center size-8">
          <Badge
            variant={isVisible ? "outline-success" : "outline-destructive"}
          >
            {isVisible ? "Visibile" : "Non Visibile"}
          </Badge>
        </div>
      );
    },
  },
];
