"use client";

import { TeamSheet } from "@/components/teams/sheet";
import { TeamCard, TeamCardData } from "./team-card";

type Props = {
  teams: Array<TeamCardData>;
  descriptionFallback?: string;
};

export function TeamsGrid({
  teams,
  descriptionFallback = "Gestione accessi e permessi del team.",
}: Props) {
  if (teams.length === 0) {
    return (
      <div className="p-2">
        <div className="flex min-h-40 w-full items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 text-center text-sm text-neutral-500">
          Nessun team presente. Crea un nuovo team per iniziare.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {teams.map((team) => (
        <TeamSheet key={team.id} team={team}>
          <button
            type="button"
            className="w-full rounded-xl text-left outline-none transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Apri dettagli team ${team.name}`}
          >
            <TeamCard team={team} description={descriptionFallback} />
          </button>
        </TeamSheet>
      ))}
    </div>
  );
}
