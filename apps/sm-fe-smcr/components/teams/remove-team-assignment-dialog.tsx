"use client";

import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type RemoveTeamAssignmentDialogProps = {
  description: string;
  endpoint: string;
  itemName: string;
  itemType: "permesso" | "utente";
  payload: Record<string, number>;
};

export function RemoveTeamAssignmentDialog({
  description,
  endpoint,
  itemName,
  itemType,
  payload,
}: RemoveTeamAssignmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isRemoving) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  async function removeAssignment() {
    setError(null);
    setIsRemoving(true);

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? `Non è stato possibile rimuovere ${itemType === "utente" ? "l'utente" : "il permesso"}.`,
        );
      }

      setOpen(false);
      router.refresh();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : `Non è stato possibile rimuovere ${itemType === "utente" ? "l'utente" : "il permesso"}.`,
      );
    } finally {
      setIsRemoving(false);
    }
  }

  const itemTypeLabel = itemType === "utente" ? "utente" : "permesso";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={`Rimuovi ${itemTypeLabel} ${itemName}`}
          title={`Rimuovi ${itemTypeLabel}`}
          className="rounded-sm p-1 text-neutral-500 transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Trash2Icon className="size-3" strokeWidth={1.75} />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Rimuovi {itemTypeLabel}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            disabled={isRemoving}
            onClick={(event) => {
              event.preventDefault();
              void removeAssignment();
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isRemoving ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Rimozione in corso…
              </>
            ) : (
              `Rimuovi ${itemTypeLabel}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
