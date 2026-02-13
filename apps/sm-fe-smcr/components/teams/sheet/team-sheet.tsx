"use client";

import { CardRow } from "@/components/core/card-row";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { deleteTeamAction } from "@/lib/actions/teams.action";
import { TeamWithPermissions } from "@/lib/services/teams.service";
import useTeamsStore from "@/lib/store/teams.store";
import {
  CalendarIcon,
  ClockIcon,
  HashIcon,
  ImageIcon,
  Link2Icon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import Permission from "./permission";

type Props = {
  children: React.ReactNode;
  team: TeamWithPermissions;
};

export function TeamSheet({ children, team }: Props) {
  const router = useRouter();
  const features = useTeamsStore((state) => state.features);
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteSubmitted, setIsDeleteSubmitted] = useState(false);
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteTeamAction,
    {
      data: {
        teamId: team.id,
      },
      error: null,
    },
  );

  useEffect(() => {
    if (!isDeleteSubmitted) {
      return;
    }

    if (deleteState.error) {
      toast.error(
        deleteState.error.root ||
          "Si e verificato un errore, riprova piu tardi.",
      );
      return;
    }

    toast.success(`Il team ${team.name} e stato eliminato correttamente.`);
    setIsDeleteDialogOpen(false);
    setOpen(false);
    router.refresh();
  }, [deleteState, isDeleteSubmitted, router, team.name]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{team.name}</SheetTitle>
          <SheetDescription>{team.slug}</SheetDescription>
        </SheetHeader>

        <div className="w-full px-4 flex flex-col gap-4">
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 gap-4 flex flex-col w-full">
            <CardRow label="ID" value={String(team.id)}>
              <HashIcon />
            </CardRow>

            <CardRow label="Nome" value={team.name}>
              <TypeIcon />
            </CardRow>

            <CardRow label="Slug" value={team.slug}>
              <Link2Icon />
            </CardRow>

            {team.icon && (
              <CardRow label="Icona" value={team.icon}>
                <ImageIcon />
              </CardRow>
            )}

            <CardRow
              label="Data Creazione"
              value={team.createdAt.toLocaleDateString()}
            >
              <CalendarIcon />
            </CardRow>

            <CardRow
              label="Data Aggiornamento"
              value={team.updatedAt.toLocaleDateString()}
            >
              <ClockIcon />
            </CardRow>
          </div>
        </div>

        <div className="w-full h-px bg-border my-4" />

        <div className="px-4 flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-medium">Permessi</h2>
            <p className="text-muted-foreground">
              Seleziona i permessi che il team può utilizzare per ciascuna
              funzionalità.
            </p>
          </div>

          {features.map((feature) => (
            <div
              key={feature.id}
              className="border bg-neutral-50 rounded-lg p-4 w-full flex flex-col gap-3"
            >
              <h3>{feature.name}</h3>

              <div className="flex flex-col gap-4">
                {feature.permissions.map((permission) => (
                  <Permission
                    key={permission.id}
                    permission={permission}
                    team={team}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <SheetFooter className="flex flex-row w-full items-center justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2Icon className="size-3.5" />
            Elimina team
          </Button>

          <Button type="submit">Salva</Button>
        </SheetFooter>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(nextOpen) => {
            if (isDeletePending) {
              return;
            }

            setIsDeleteDialogOpen(nextOpen);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Elimina team</AlertDialogTitle>
              <AlertDialogDescription>
                Stai per eliminare definitivamente il team {team.name}. Questa
                operazione non puo essere annullata.
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

              <form action={deleteAction}>
                <input type="hidden" name="teamId" value={team.id} />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isDeletePending}
                  onClick={() => setIsDeleteSubmitted(true)}
                >
                  {isDeletePending ? <Spinner className="size-3.5" /> : null}
                  Elimina team
                </Button>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
