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
import { useState } from "react";
import { TeamDeleteDialog } from "./team-delete-dialog";
import { TeamEditDialog } from "./team-edit-dialog";

type Props = {
  teamId: number;
  teamName: string;
  teamSlug: string;
  teamIcon: string | null;
};

export function TeamCardActionsDropdown({
  teamId,
  teamName,
  teamSlug,
  teamIcon,
}: Props) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isAdminTeam = teamSlug === "admin";

  return (
    <>
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
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setIsEditDialogOpen(true);
            }}
          >
            Modifica team
          </DropdownMenuItem>
          <DropdownMenuItem>Gestisci permessi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isAdminTeam}
            onSelect={(event) => {
              event.preventDefault();

              if (!isAdminTeam) {
                setIsDeleteDialogOpen(true);
              }
            }}
          >
            Elimina team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditDialogOpen ? (
        <TeamEditDialog
          teamId={teamId}
          teamName={teamName}
          teamSlug={teamSlug}
          teamIcon={teamIcon}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      ) : null}

      {isDeleteDialogOpen ? (
        <TeamDeleteDialog
          teamId={teamId}
          teamName={teamName}
          teamSlug={teamSlug}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        />
      ) : null}
    </>
  );
}
