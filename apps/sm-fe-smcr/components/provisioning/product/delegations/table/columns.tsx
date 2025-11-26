"use client";

import { Badge } from "@/components/ui/badge";
import { Delegation } from "@/lib/services/delegations.service";
import { ColumnDef } from "@tanstack/react-table";
import DeleteDelegation from "./delete-delegation";

export const columns: ColumnDef<Delegation>[] = [
  {
    accessorKey: "id",
    header: "ID",
    enableGlobalFilter: true,
  },
  {
    accessorKey: "brokerTaxCode",
    header: "Codice Fiscale delegato",
    enableGlobalFilter: true,
  },
  {
    accessorKey: "brokerType",
    header: "Tipo delega",
  },
  {
    accessorKey: "brokerName",
    header: "Nome delegato",
  },
  {
    accessorKey: "status",
    header: "Stato delega",
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

      return <Badge variant="outline">{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const id = row.original.id;

      return <DeleteDelegation id={id} />;
    },
  },
];
