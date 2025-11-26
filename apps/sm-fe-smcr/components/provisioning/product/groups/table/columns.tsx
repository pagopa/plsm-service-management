"use client";

import { Badge } from "@/components/ui/badge";
import { UserGroup } from "@/lib/services/institution.service";
import { PRODUCT_MAP } from "@/lib/types/product";
import { ColumnDef } from "@tanstack/react-table";
import UserPopover from "./user-popover";

export const columns: ColumnDef<UserGroup>[] = [
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
    accessorKey: "productId",
    header: "Prodotto",
    cell: ({ row }) => {
      const value = row.original.productId;

      return <p>{PRODUCT_MAP[value] || value}</p>;
    },
  },
  {
    accessorKey: "members",
    header: "Membri",
    cell: ({ row }) => {
      const members = row.original.members;

      return <UserPopover users={members} />;
    },
  },
  {
    accessorKey: "status",
    header: "Stato",
    cell: ({ row }) => {
      const status = row.original.status;

      if (status === "ACTIVE") {
        return <Badge variant="outline-success">Attivo</Badge>;
      }

      if (status === "SUSPENDED") {
        return <Badge variant="outline-warning">Sospeso</Badge>;
      }

      if (status === "DELETED") {
        return <Badge variant="outline-destructive">Eliminato</Badge>;
      }

      return <Badge variant="outline">{status}</Badge>;
    },
  },
];
