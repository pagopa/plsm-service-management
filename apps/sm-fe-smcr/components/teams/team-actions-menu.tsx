"use client";

import { EllipsisVertical, LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditTeamDialog } from "@/components/teams/edit-team-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TeamStatus = "active" | "inactive";

type TeamActionsMenuProps = {
  department: string | null;
  description: string | null;
  status: TeamStatus;
  teamId: number;
  teamName: string;
};

export function TeamActionsMenu({
  department,
  description,
  status,
  teamId,
  teamName,
}: TeamActionsMenuProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const nextStatus: TeamStatus = status === "active" ? "inactive" : "active";

  async function updateStatus() {
    setStatusError(null);
    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        body: JSON.stringify({ status: nextStatus }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile aggiornare lo stato del team.",
        );
      }

      router.refresh();
    } catch (updateError) {
      setStatusError(
        updateError instanceof Error
          ? updateError.message
          : "Non è stato possibile aggiornare lo stato del team.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleDeleteDialogOpenChange(nextOpen: boolean) {
    if (isDeleting) {
      return;
    }

    setDeleteDialogOpen(nextOpen);

    if (!nextOpen) {
      setDeleteError(null);
    }
  }

  async function deleteTeam() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile eliminare il team.",
        );
      }

      router.replace("/dashboard/teams");
      router.refresh();
    } catch (deleteTeamError) {
      setDeleteError(
        deleteTeamError instanceof Error
          ? deleteTeamError.message
          : "Non è stato possibile eliminare il team.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const isBusy = isUpdatingStatus || isDeleting;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Azioni team"
            title="Azioni team"
            disabled={isBusy}
            className="rounded-sm text-neutral-700 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isBusy ? (
              <LoaderCircleIcon className="size-3 animate-spin" />
            ) : (
              <EllipsisVertical className="size-3" strokeWidth={1.75} />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={isBusy}
            onSelect={() => setEditDialogOpen(true)}
          >
            Modifica dettagli
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Stato team</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={isBusy}
            onSelect={(event) => {
              event.preventDefault();
              void updateStatus();
            }}
          >
            {isUpdatingStatus
              ? "Aggiornamento in corso…"
              : status === "active"
                ? "Disattiva team"
                : "Attiva team"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isBusy}
            onSelect={() => setDeleteDialogOpen(true)}
          >
            Elimina team
          </DropdownMenuItem>
          {statusError ? (
            <DropdownMenuLabel className="max-w-56 text-xs font-normal text-destructive">
              {statusError}
            </DropdownMenuLabel>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTeamDialog
        department={department}
        description={description}
        name={teamName}
        onOpenChange={setEditDialogOpen}
        open={editDialogOpen}
        teamId={teamId}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il team?</AlertDialogTitle>
            <AlertDialogDescription>
              Il team <strong>{teamName}</strong> verrà eliminato definitivamente.
              Verranno rimosse anche tutte le assegnazioni di utenti e permessi.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {deleteError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void deleteTeam();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Eliminazione in corso…
                </>
              ) : (
                "Elimina team"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
