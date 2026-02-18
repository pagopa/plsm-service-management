"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";

type Props = {
  teamName: string;
};

export function TeamCardActionsDropdown({ teamName }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="size-6 p-0 text-neutral-500 hover:text-neutral-700"
          aria-label={`Apri azioni per ${teamName}`}
        >
          <EllipsisVertical className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Azioni team</DropdownMenuLabel>
        <DropdownMenuItem>Modifica team</DropdownMenuItem>
        <DropdownMenuItem>Gestisci permessi</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Elimina team</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
