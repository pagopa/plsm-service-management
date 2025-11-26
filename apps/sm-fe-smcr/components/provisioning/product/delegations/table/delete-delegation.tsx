"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteDelegationAction } from "@/lib/actions/delegation.action";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export default function DeleteDelegation({ id }: { id: string }) {
  const router = useRouter();
  const [state, action, isPending] = useActionState(deleteDelegationAction, {
    fields: { id: "" },
  });

  useEffect(() => {
    if (state.fields.id) {
      if (state.errors) {
        if (state.errors.root) {
          toast.error(
            state.errors.root || "Errore durante l'eliminazione della delega.",
          );
        }
      } else {
        toast.success("Delega eliminata correttamente.");
        router.refresh();
      }
    }
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        className="size-8 p-0"
        disabled={isPending}
      >
        {isPending ? (
          <Spinner className="size-3.5 opacity-60" />
        ) : (
          <TrashIcon className="size-3.5 opacity-60" />
        )}
      </Button>
    </form>
  );
}
