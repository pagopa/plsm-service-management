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
  type UpdateTeamFormState,
  updateTeamAction,
} from "@/lib/actions/teams.action";
import { PencilLineIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  teamId: number;
  teamName: string;
  teamSlug: string;
  teamIcon: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: UpdateTeamFormState = {
  data: {},
  error: null,
};

export function TeamEditDialog({
  teamId,
  teamName,
  teamSlug,
  teamIcon,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(teamName);
  const [icon, setIcon] = useState(teamIcon ?? "");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateTeamAction,
    initialState,
  );

  const isUnchanged =
    name.trim() === teamName.trim() && icon === (teamIcon ?? "");
  const canSubmit = !isPending && name.trim().length > 0 && !isUnchanged;

  useEffect(() => {
    setName(teamName);
    setIcon(teamIcon ?? "");
    setIsSubmitted(false);
  }, [open, teamIcon, teamName]);

  useEffect(() => {
    if (!isSubmitted || isPending) {
      return;
    }

    if (state.error) {
      if (state.error.root) {
        toast.error("Aggiornamento team non riuscito", {
          description: state.error.root,
        });
      }

      setIsSubmitted(false);
      return;
    }

    if (state.data.teamId) {
      toast.success(`Il team ${name.trim()} è stato aggiornato.`);
      setIsSubmitted(false);
      onOpenChange(false);
      router.refresh();
    }
  }, [isPending, isSubmitted, name, onOpenChange, router, state]);

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
              Modifica team
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
              <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5">
                <PencilLineIcon className="size-3 shrink-0 text-neutral-600" />
                <p className="text-sm text-neutral-700">
                  Aggiorna i dettagli del team.
                </p>
              </div>

              <div className="space-y-2!">
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`team-name-${teamId}`}
                    className="font-normal text-neutral-700"
                  >
                    Nome team
                  </Label>
                  <Input
                    id={`team-name-${teamId}`}
                    name="name"
                    value={name}
                    autoComplete="off"
                    onChange={(event) => setName(event.target.value)}
                    disabled={isPending}
                  />

                  {state.error?.name && (
                    <p className="text-xs text-red-600">{state.error.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor={`team-slug-${teamId}`}
                    className="font-normal text-neutral-700"
                  >
                    Slug
                  </Label>
                  <Input
                    id={`team-slug-${teamId}`}
                    name="slug"
                    value={teamSlug}
                    readOnly
                    className="bg-neutral-100 text-neutral-500"
                  />

                  <p className="text-sm leading-tight text-neutral-500">
                    Lo slug è in sola lettura.
                  </p>

                  {state.error?.slug && (
                    <p className="text-xs text-red-600">{state.error.slug}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor={`team-icon-${teamId}`}
                    className="font-normal text-neutral-700"
                  >
                    Icona
                  </Label>
                  <Input
                    id={`team-icon-${teamId}`}
                    name="icon"
                    value={icon}
                    autoComplete="off"
                    onChange={(event) => setIcon(event.target.value)}
                    disabled={isPending}
                  />

                  {state.error?.icon && (
                    <p className="text-xs text-red-600">{state.error.icon}</p>
                  )}
                </div>

                {state.error?.root && (
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
              size="sm"
              variant="pagopaprimary"
              disabled={!canSubmit}
            >
              {isPending ? <Spinner className="size-3.5" /> : null}
              Salva modifiche
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
