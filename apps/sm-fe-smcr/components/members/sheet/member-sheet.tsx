import { CardRow } from "@/components/core/card-row";
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
import { MemberWithTeams } from "@/lib/services/members.service";
import useTeamsStore from "@/lib/store/teams.store";
import {
  CalendarIcon,
  ClockIcon,
  HashIcon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import TeamCheckbox from "./team-checkbox";

type Props = {
  children: React.ReactNode;
  member: MemberWithTeams;
};

export function MemberSheet({ children, member }: Props) {
  const teams = useTeamsStore((state) => state.teams);

  return (
    <Sheet>
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

        <SheetFooter className="flex flex-row w-full items-center justify-end">
          <SheetClose asChild>
            <Button variant="outline">Annulla</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
