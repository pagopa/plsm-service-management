"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberWithTeams } from "@/lib/services/members.service";
import { Team } from "@/lib/services/teams.service";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<MemberWithTeams>[] = [
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
    accessorKey: "teams",
    header: "Teams",
    cell: ({ row }) => {
      const teams = row.getValue<Team[]>("teams");
      if (!teams || teams.length === 0) {
        return <div className="text-muted-foreground text-sm">Nessun team</div>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {teams.map((team) => (
            <Badge key={team.id} variant="secondary">
              {team.name}
            </Badge>
          ))}
        </div>
      );
    },
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
