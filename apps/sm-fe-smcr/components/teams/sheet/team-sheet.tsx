import { CardRow } from "@/components/core/card-row";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { TeamWithPermissions } from "@/lib/services/teams.service";
import useTeamsStore from "@/lib/store/teams.store";
import {
  CalendarIcon,
  ClockIcon,
  HashIcon,
  ImageIcon,
  Link2Icon,
  TypeIcon,
} from "lucide-react";
import Permission from "./permission";

type Props = {
  children: React.ReactNode;
  team: TeamWithPermissions;
};

export function TeamSheet({ children, team }: Props) {
  const features = useTeamsStore((state) => state.features);

  return (
    <Sheet>
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
          <SheetClose asChild>
            <Button variant="outline">Annulla</Button>
          </SheetClose>

          <Button type="submit">Salva</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
