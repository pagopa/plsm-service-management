"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  syncTeamPermissionsAction,
  type SyncTeamPermissionsFormState,
} from "@/lib/actions/teams.action";
import useTeamsStore from "@/lib/store/teams.store";
import { LockKeyholeOpenIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Props = {
  teamId: number;
  teamName: string;
  teamPermissionIds: Array<number>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: SyncTeamPermissionsFormState = {
  data: {},
  error: null,
};

function areSamePermissionSets(a: Array<number>, b: Array<number>) {
  if (a.length !== b.length) {
    return false;
  }

  const aSet = new Set(a);
  return b.every((permissionId) => aSet.has(permissionId));
}

export function TeamPermissionsDialog({
  teamId,
  teamName,
  teamPermissionIds,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const features = useTeamsStore((state) => state.features);
  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<Array<number>>(teamPermissionIds);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [state, formAction, isPending] = useActionState(
    syncTeamPermissionsAction,
    initialState,
  );

  useEffect(() => {
    if (open) {
      setSelectedPermissionIds(teamPermissionIds);
      setIsSubmitted(false);
    }
  }, [open, teamPermissionIds]);

  const hasChanges = useMemo(
    () => !areSamePermissionSets(selectedPermissionIds, teamPermissionIds),
    [selectedPermissionIds, teamPermissionIds],
  );

  useEffect(() => {
    if (!isSubmitted || isPending) {
      return;
    }

    if (state.error) {
      if (state.error.root) {
        toast.error("Aggiornamento permessi non riuscito", {
          description: state.error.root,
        });
      }

      setIsSubmitted(false);
      return;
    }

    if (state.data.teamId) {
      toast.success(`Permessi del team ${teamName} aggiornati.`);
      setIsSubmitted(false);
      onOpenChange(false);
      router.refresh();
    }
  }, [isPending, isSubmitted, onOpenChange, router, state, teamName]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) {
          return;
        }

        if (!nextOpen) {
          setSelectedPermissionIds(teamPermissionIds);
          setIsSubmitted(false);
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl! gap-0 overflow-hidden border-neutral-200 bg-neutral-100 p-0 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between p-2">
          <div className="flex items-baseline gap-1.5">
            <DialogTitle className="text-sm font-medium text-neutral-800">
              Gestisci permessi
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
          <input
            type="hidden"
            name="permissionIds"
            value={JSON.stringify(selectedPermissionIds)}
          />

          <div className="px-1.5 pb-1.5">
            <div className="space-y-4 rounded-md border border-neutral-200 bg-white p-2">
              <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5">
                <LockKeyholeOpenIcon className="size-3 shrink-0 text-neutral-600" />
                <p className="text-sm text-neutral-700">
                  Seleziona i permessi disponibili per il team.
                </p>
              </div>

              {features.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessuna feature disponibile.
                </p>
              ) : (
                <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                  {features.map((feature) => (
                    <div
                      key={feature.id}
                      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-2"
                    >
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-medium text-neutral-800">
                          {feature.name}
                        </h3>
                        {feature.description ? (
                          <p className="text-xs text-neutral-500">
                            {feature.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        {feature.permissions.map((permission) => {
                          const permissionId = permission.id;
                          const isChecked =
                            selectedPermissionIds.includes(permissionId);

                          return (
                            <div
                              key={`${teamId}-${permissionId}`}
                              className="rounded-md border border-neutral-200 bg-white px-2 py-1.5"
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id={`permission-${teamId}-${permissionId}`}
                                  checked={isChecked}
                                  disabled={isPending}
                                  onCheckedChange={(checked) => {
                                    setSelectedPermissionIds((previous) => {
                                      if (checked) {
                                        if (previous.includes(permissionId)) {
                                          return previous;
                                        }

                                        return [...previous, permissionId];
                                      }

                                      return previous.filter(
                                        (id) => id !== permissionId,
                                      );
                                    });
                                  }}
                                />

                                <div className="grid grow gap-1">
                                  <Label
                                    htmlFor={`permission-${teamId}-${permissionId}`}
                                    className="font-normal"
                                  >
                                    {permission.name}
                                  </Label>

                                  {permission.description ? (
                                    <p className="text-sm text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.error?.permissionIds ? (
                <p className="text-xs text-red-600">
                  {state.error.permissionIds}
                </p>
              ) : null}

              {state.error?.root ? (
                <p className="text-xs text-red-600">{state.error.root}</p>
              ) : null}
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
              variant="pagopaprimary"
              size="sm"
              disabled={!hasChanges || isPending}
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
