"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  deleteTeamAction,
  type DeleteTeamFormState,
} from "@/lib/actions/teams.action";
import { CircleAlertIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

type Props = {
  teamId: number;
  teamName: string;
  teamSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: DeleteTeamFormState = {
  data: {},
  error: null,
};

export function TeamDeleteDialog({
  teamId,
  teamName,
  teamSlug,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const inputId = useId();
  const [confirmationText, setConfirmationText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteTeamAction,
    initialState,
  );

  const isAdminTeam = useMemo(() => teamSlug === "admin", [teamSlug]);
  const canSubmit = confirmationText === teamName && !isPending && !isAdminTeam;

  useEffect(() => {
    if (open) {
      return;
    }

    setConfirmationText("");
    setIsSubmitted(false);
  }, [open]);

  useEffect(() => {
    if (!isSubmitted || isPending) {
      return;
    }

    if (state.error) {
      if (state.error.root) {
        toast.error("Eliminazione team non riuscita", {
          description: state.error.root,
        });
      }

      setIsSubmitted(false);
      return;
    }

    if (state.data.teamId) {
      toast.success(`Il team ${teamName} è stato eliminato.`);
      setIsSubmitted(false);
      onOpenChange(false);
      router.refresh();
    }
  }, [isPending, isSubmitted, onOpenChange, router, state, teamName]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-sm! gap-0 overflow-hidden border-neutral-200 bg-neutral-100 p-0 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between p-2">
          <div className="flex items-baseline gap-1.5">
            <DialogTitle className="text-sm font-medium text-neutral-800">
              Elimina team
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              {teamName}
            </DialogDescription>
          </div>

          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-5 p-0 text-neutral-500 hover:text-neutral-700"
              disabled={isPending}
            >
              <XIcon className="size-3" />
              <span className="sr-only">Chiudi</span>
            </Button>
          </DialogClose>
        </div>

        <form
          action={formAction}
          onSubmit={() => setIsSubmitted(true)}
          className="space-y-0"
        >
          <input type="hidden" name="teamId" value={teamId} />

          <div className="px-1.5 pb-1.5">
            <div className="space-y-4 rounded-md border border-neutral-200 bg-white p-2">
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5">
                <CircleAlertIcon className="size-3 shrink-0 text-red-600" />
                <p className="text-sm text-red-600">
                  Questo team sarà eliminato permanentemente.
                </p>
              </div>

              <div className="space-y-2!">
                <Label
                  htmlFor={inputId}
                  className="font-normal text-neutral-700"
                >
                  Scrivi &quot;{teamName}&quot; per confermare
                </Label>

                <Input
                  id={inputId}
                  name="confirmationText"
                  value={confirmationText}
                  autoComplete="off"
                  onChange={(event) => setConfirmationText(event.target.value)}
                  disabled={isPending || isAdminTeam}
                />

                <p className="text-sm leading-tight text-neutral-500">
                  Questo previene eliminazioni accidentali.
                </p>

                {isAdminTeam && (
                  <p className="text-xs text-red-600">
                    Il team admin non può essere eliminato.
                  </p>
                )}

                {state.error?.confirmationText && (
                  <p className="text-xs text-red-600">
                    {state.error.confirmationText}
                  </p>
                )}

                {state.error?.root && !isAdminTeam && (
                  <p className="text-xs text-red-600">{state.error.root}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 p-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
              >
                Annulla
                <span className="font-mono text-xs opacity-60">ESC</span>
              </Button>
            </DialogClose>

            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={!canSubmit}
            >
              {isPending ? <Spinner className="size-3.5" /> : null}
              Elimina team
              {!isPending ? (
                <span className="font-mono text-xs opacity-70">↵</span>
              ) : null}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
