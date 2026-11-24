"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { OnboardedInstitution } from "@/lib/services/onboarded-institutions.service";

/** `YYYY-MM-DD` → `DD/MM/YYYY` */
export function formatItDay(day: string) {
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

export const onboardedInstitutionsColumns: ColumnDef<OnboardedInstitution>[] =
  [
    {
      id: "giorno_attivazione",
      accessorKey: "giorno_attivazione",
      header: "Data attivazione",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatItDay(row.original.giorno_attivazione)}
        </span>
      ),
    },
    {
      id: "prodotto",
      accessorKey: "prodotto",
      header: "Prodotto",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-medium">
          {row.original.prodotto}
        </Badge>
      ),
    },
    {
      id: "ente",
      accessorKey: "nome_ente",
      header: "Ente",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-semibold leading-tight">
            {row.original.nome_ente}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
            {row.original.id_ente}
          </p>
        </div>
      ),
    },
  ];
