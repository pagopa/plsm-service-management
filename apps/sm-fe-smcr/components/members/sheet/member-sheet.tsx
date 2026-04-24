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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { deleteMemberAction } from "@/lib/actions/members.action";
import { MemberWithTeams } from "@/lib/services/members.service";
import useAuthStore from "@/lib/store/auth.store";
import useTeamsStore from "@/lib/store/teams.store";
import {
  CalendarIcon,
  ClockIcon,
  HashIcon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import TeamCheckbox from "./team-checkbox";

type Props = {
  children: React.ReactNode;
  member: MemberWithTeams;
};

export function MemberSheet({ children, member }: Props) {
  const teams = useTeamsStore((state) => state.teams);
  const authUser = useAuthStore((state) => state.user);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const isCurrentUser = authUser?.id === member.id;

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isDeletePending) {
        return;
      }

      setOpen(nextOpen);

      if (!nextOpen) {
        setIsDeleteDialogOpen(false);
      }
    },
    [isDeletePending],
  );

  const handleDeleteDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isDeletePending) {
        return;
      }

      setIsDeleteDialogOpen(nextOpen);
    },
    [isDeletePending],
  );

  const handleMemberDelete = useCallback(() => {
    if (isCurrentUser) {
      return;
    }

    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("memberId", String(member.id));

      const result = await deleteMemberAction(undefined, formData);

      if (result.error) {
        toast.error(
          "Eliminazione utente non riuscita",
          result.error.root ? { description: result.error.root } : undefined,
        );
        return;
      }

      toast.success(
        `L'utente ${member.firstname} ${member.lastname} è stato eliminato.`,
      );
      setIsDeleteDialogOpen(false);
      setOpen(false);
      router.refresh();
    });
  }, [isCurrentUser, member.firstname, member.id, member.lastname, router]);

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {member.firstname} {member.lastname}
          </SheetTitle>
          <SheetDescription>{member.email}</SheetDescription>
        </SheetHeader>

        <div className="w-full px-4 flex flex-col gap-4">
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 gap-4 flex flex-col w-full">
            <CardRow label="ID" value={String(member.id)}>
              <HashIcon />
            </CardRow>

            <CardRow label="Nome" value={member.firstname}>
              <UserIcon />
            </CardRow>

            <CardRow label="Cognome" value={member.lastname}>
              <UserIcon />
            </CardRow>

            <CardRow label="Email" value={member.email}>
              <MailIcon />
            </CardRow>

            <CardRow
              label="Data Creazione"
              value={member.createdAt.toLocaleDateString()}
            >
              <CalendarIcon />
            </CardRow>

            <CardRow
              label="Data Aggiornamento"
              value={member.updatedAt.toLocaleDateString()}
            >
              <ClockIcon />
            </CardRow>
          </div>
        </div>

        <div className="w-full h-px bg-border my-4" />

        <div className="px-4 flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-medium">Teams</h2>
            <p className="text-muted-foreground text-sm">
              Seleziona i team a cui il membro appartiene.
            </p>
          </div>

          <div className="border bg-neutral-50 rounded-lg p-4 w-full flex flex-col gap-3">
            {teams.map((team) => (
              <TeamCheckbox key={team.id} team={team} member={member} />
            ))}
          </div>
        </div>

        <SheetFooter className="w-full gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {isCurrentUser ? "Non puoi eliminare il tuo utente." : null}
          </div>

          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
            <SheetClose asChild>
              <Button variant="outline" disabled={isDeletePending}>
                Annulla
              </Button>
            </SheetClose>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeletePending || isCurrentUser}
            >
              Elimina utente
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina utente</AlertDialogTitle>
            <AlertDialogDescription>
              {`Stai per eliminare definitivamente l'utente ${member.firstname} ${member.lastname}. Questa operazione non può essere annullata.`}
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
              disabled={isDeletePending || isCurrentUser}
            >
              {isDeletePending ? <Spinner className="size-3.5" /> : null}
              Elimina utente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
