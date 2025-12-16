"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
};

export const getColumns: (
  teams: Array<Team>,
  updateTeam: (
    prevState: any,
    formData: FormData,
  ) => { data: string; error?: string },
) => ColumnDef<Member>[] = (teams, updateTeam) => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "teams",
    header: "Team",
    cell: ({ row }) => {
      const [isPending, startTransition] = useTransition();
      const ref = useRef<HTMLFormElement | null>(null);
      const [state, action] = useActionState(updateTeam, {
        data: "",
      });

      function handleSubmit() {
        if (ref.current) {
          startTransition(() => {
            action(new FormData(ref.current!));
          });
        }
      }

      useEffect(() => {
        console.log({ state, isPending });
      }, [state, isPending]);

      return (
        <form action={action} ref={ref}>
          <input type="hidden" name="user" value={row.getValue("id")} />
          <Select
            name="team"
            onValueChange={handleSubmit}
            defaultValue={(row.getValue("teams") as Array<string>).at(0) || ""}
          >
            <SelectTrigger className="ui:w-40">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>

            <SelectContent>
              {teams.map((team: any) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ui:h-8 ui:w-8 ui:p-0">
              <span className="ui:sr-only">Open menu</span>
              <MoreHorizontal className="ui:h-4 ui:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
