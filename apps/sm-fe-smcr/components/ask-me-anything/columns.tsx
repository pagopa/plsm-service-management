"use client";

import { Badge } from "@/components/ui/badge";
import { AskMeAnythingMember } from "@/lib/services/ask-me-anything.service";
import { ColumnDef } from "@tanstack/react-table";

const getAccessBadge = (hasAccess: boolean) => (
  <Badge variant={hasAccess ? "outline-success" : "outline-destructive"}>
    {hasAccess ? "Abilitato" : "Non abilitato"}
  </Badge>
);

export const askMeAnythingColumns = (): ColumnDef<AskMeAnythingMember>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "firstname",
    header: "Nome",
  },
  {
    accessorKey: "lastname",
    header: "Cognome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "selfcareAccess",
    header: "Selfcare",
    cell: ({ row }) => getAccessBadge(row.getValue<boolean>("selfcareAccess")),
  },
  {
    accessorKey: "legalAccess",
    header: "Legal",
    cell: ({ row }) => getAccessBadge(row.getValue<boolean>("legalAccess")),
  },
];
