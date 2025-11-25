"use client";

import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";

export type User = {
  id: string;
  role: "SUB_DELEGATE" | "DELEGATE" | "OPERATOR" | "MANAGER";
  email: string;
  name: string;
  surname: string;
  roles: ("admin" | "operator")[];
};

export const provisioningUsersColumns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "surname",
    header: "Cognome",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell({ row }) {
      return <Badge variant="secondary">{row.getValue("role")}</Badge>;
    },
  },
];
