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

type ArchivePermissionDialogProps = {
  permissionId: number | string;
  permissionName: string;
};

export function ArchivePermissionDialog({
  permissionId,
  permissionName,
}: ArchivePermissionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isArchiving) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  async function archivePermission() {
    setError(null);
    setIsArchiving(true);

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile archiviare il permesso. Riprova.",
        );
      }

      setOpen(false);
      router.refresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Non è stato possibile archiviare il permesso. Riprova.",
      );
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={`Archivia permesso ${permissionName}`}
          title="Archivia permesso"
          className="rounded-sm p-1 text-neutral-500 transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Trash2Icon className="size-3" strokeWidth={1.75} />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archivia permesso?</AlertDialogTitle>
          <AlertDialogDescription>
            Il permesso “{permissionName}” non sarà più disponibile nella lista o
            assegnabile ai nuovi team. Le associazioni esistenti saranno conservate.
          </AlertDialogDescription>
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
          <AlertDialogCancel disabled={isArchiving}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            disabled={isArchiving}
            onClick={(event) => {
              event.preventDefault();
              void archivePermission();
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isArchiving ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Archiviazione in corso…
              </>
            ) : (
              "Archivia permesso"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
