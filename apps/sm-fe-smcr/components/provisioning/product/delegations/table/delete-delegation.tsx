"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteDelegationAction } from "@/lib/actions/delegation.action";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  id: string;
  brokerName: string;
  brokerTaxCode: string;
};

export default function DeleteDelegation({
  id,
  brokerName,
  brokerTaxCode,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [state, action, isPending] = useActionState(deleteDelegationAction, {
    fields: { id: "" },
  });

  useEffect(() => {
    if (!isSubmitted || isPending) {
      return;
    }

    if (state.errors) {
      toast.error(
        state.errors.root || "Errore durante l'eliminazione della delega.",
      );
      setIsSubmitted(false);
      return;
    }

    if (state.fields.id) {
      toast.success("Delega eliminata correttamente.");
      setIsSubmitted(false);
      setOpen(false);
      router.refresh();
    }
  }, [isPending, isSubmitted, router, state]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="size-8 p-0"
          disabled={isPending}
        >
          {isPending ? (
            <Spinner className="size-3.5 opacity-60" />
          ) : (
            <TrashIcon className="size-3.5 opacity-60" />
          )}
          <span className="sr-only">Elimina delega</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Elimina delega</AlertDialogTitle>
          <AlertDialogDescription>
            {`Stai per eliminare definitivamente la delega per ${brokerName} (${brokerTaxCode}). Questa operazione non può essere annullata.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={action} onSubmit={() => setIsSubmitted(true)}>
          <input type="hidden" name="id" value={id} />

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Annulla
              </Button>
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? <Spinner className="size-3.5" /> : null}
              Elimina delega
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
