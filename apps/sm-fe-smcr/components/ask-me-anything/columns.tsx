"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AskMeAnythingMember } from "@/lib/services/ask-me-anything.service";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2Icon } from "lucide-react";

interface AskMeAnythingColumnsOptions {
  onDeleteClick?: (member: AskMeAnythingMember) => void;
}

const getAccessBadge = (hasAccess: boolean) => (
  <Badge variant={hasAccess ? "outline-success" : "outline-destructive"}>
    {hasAccess ? "Abilitato" : "Non abilitato"}
  </Badge>
);

export const askMeAnythingColumns = ({
  onDeleteClick,
}: AskMeAnythingColumnsOptions = {}): ColumnDef<AskMeAnythingMember>[] => [
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
  {
    id: "actions",
    header: "Azioni",
    cell: ({ row }) => (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 p-0 text-destructive hover:text-destructive"
        onClick={(event) => {
          event.stopPropagation();
          onDeleteClick?.(row.original);
        }}
        aria-label="Elimina utente"
      >
        <Trash2Icon className="size-3.5 opacity-70" />
      </Button>
    ),
  },
];
