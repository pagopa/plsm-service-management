"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { AskMeAnythingTable } from "./table";
import { askMeAnythingColumns } from "./columns";
import { AskMeAnythingMember } from "@/lib/services/ask-me-anything.service";
import {
  AskMeAnythingEditMemberDialog,
  type AskMeAnythingMemberFormValues,
} from "./member-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteAskMeAnythingMemberAction } from "@/lib/actions/ask-me-anything.action";
import { toast } from "sonner";

export interface AskMeAnythingTableSectionProps {
  initialRows: AskMeAnythingMember[];
}

export function AskMeAnythingTableSection({
  initialRows,
}: AskMeAnythingTableSectionProps) {
  const [rows, setRows] = useState<AskMeAnythingMember[]>(initialRows);
  const [editingMember, setEditingMember] =
    useState<AskMeAnythingMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] =
    useState<AskMeAnythingMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();

  const handleDeleteClick = useCallback((member: AskMeAnythingMember) => {
    setDeletingMember(member);
    setIsDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => askMeAnythingColumns({ onDeleteClick: handleDeleteClick }),
    [handleDeleteClick],
  );

  const handleRowClick = useCallback((member: AskMeAnythingMember) => {
    setEditingMember(member);
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogOpenChange = useCallback((open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingMember(null);
    }
  }, []);

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (isDeletePending) {
        return;
      }

      setIsDeleteDialogOpen(open);
      if (!open) {
        setDeletingMember(null);
      }
    },
    [isDeletePending],
  );

  const handleMemberUpdate = useCallback(
    (updatedMember: AskMeAnythingMemberFormValues) => {
      if (!updatedMember.id) {
        return;
      }

      setRows((prev) =>
        prev.map((member) =>
          member.id === updatedMember.id
            ? { ...member, ...updatedMember }
            : member,
        ),
      );
      setEditingMember((prev) =>
        prev && prev.id === updatedMember.id
          ? { ...prev, ...updatedMember }
          : prev,
      );
    },
    [],
  );

  const handleMemberDelete = useCallback(() => {
    if (!deletingMember) {
      return;
    }

    const memberId = deletingMember.id;

    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(memberId));

      const result = await deleteAskMeAnythingMemberAction(undefined, formData);

      if (result.error) {
        toast.error(
          "Eliminazione utente non riuscita",
          result.error.root ? { description: result.error.root } : undefined,
        );
        return;
      }

      setRows((prev) => prev.filter((member) => member.id !== memberId));
      setEditingMember((prev) => (prev?.id === memberId ? null : prev));
      setDeletingMember(null);
      setIsDeleteDialogOpen(false);
      toast.success("Utente eliminato correttamente.");
    });
  }, [deletingMember, startDeleteTransition]);

  return (
    <>
      <AskMeAnythingTable
        columns={columns}
        data={rows}
        onRowClick={handleRowClick}
      />

      <AskMeAnythingEditMemberDialog
        member={editingMember}
        open={Boolean(editingMember) && isEditDialogOpen}
        onOpenChange={handleEditDialogOpenChange}
        onSuccess={handleMemberUpdate}
      />

      <AlertDialog
        open={Boolean(deletingMember) && isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina utente</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingMember
                ? `Stai per eliminare definitivamente l'utente ${deletingMember.firstname} ${deletingMember.lastname}. Questa operazione non può essere annullata.`
                : "Questa operazione non può essere annullata."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isDeletePending}
              >
                Annulla
              </Button>
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleMemberDelete}
              disabled={isDeletePending || !deletingMember}
            >
              {isDeletePending ? <Spinner className="size-3.5" /> : null}
              Elimina utente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
