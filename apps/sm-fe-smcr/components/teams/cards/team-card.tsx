import { TeamWithPermissions } from "@/lib/services/teams.service";
import { CalendarIcon, LockKeyholeOpenIcon, UsersIcon } from "lucide-react";
import { TeamCardActionsDropdown } from "./team-card-actions-dropdown";

const fallbackDescription = "Gestione accessi e permessi del team.";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export type TeamCardData = TeamWithPermissions & {
  memberCount: number;
  featureLabels: Array<string>;
};

type Props = {
  team: TeamCardData;
  description?: string;
};

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatDate(value: Date) {
  return dateFormatter.format(new Date(value));
}

export function TeamCard({ team, description = fallbackDescription }: Props) {
  const visibleFeatureLabels = team.featureLabels.slice(0, 3);
  const hiddenFeatureLabelsCount = Math.max(
    team.featureLabels.length - visibleFeatureLabels.length,
    0,
  );

  return (
    <div className="w-full rounded-xl border border-neutral-100 bg-neutral-50 p-2">
      <div className="flex items-center justify-between rounded-xl p-1">
        <p className="text-xs text-neutral-500">{team.slug}</p>
        <TeamCardActionsDropdown
          teamId={team.id}
          teamName={team.name}
          teamSlug={team.slug}
          teamIcon={team.icon}
        />
      </div>

      <div className="w-full rounded-xl border border-neutral-100 bg-white p-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-medium text-neutral-800">
              {team.name}
            </h3>
            <p className="text-xs text-neutral-500">#{team.id}</p>
          </div>

          <p className="text-xs text-neutral-700">{description}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <UsersIcon className="size-3 text-neutral-500" />
            <p className="font-mono text-base text-neutral-700">
              {formatCountLabel(team.memberCount, "utente", "utenti")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <LockKeyholeOpenIcon className="size-3 text-neutral-500" />
            <p className="font-mono text-base text-neutral-700">
              {formatCountLabel(
                team.permissions.length,
                "permesso",
                "permessi",
              )}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <CalendarIcon className="size-3 text-neutral-500" />
            <p className="font-mono text-base text-neutral-700">
              {formatDate(team.createdAt)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <CalendarIcon className="size-3 text-neutral-500" />
            <p className="font-mono text-base text-neutral-700">
              {formatDate(team.updatedAt)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {visibleFeatureLabels.length === 0 ? (
            <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-xs text-neutral-700">
              Nessuna feature
            </span>
          ) : (
            visibleFeatureLabels.map((featureLabel) => (
              <span
                key={`${team.id}-${featureLabel}`}
                className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-xs text-neutral-700"
              >
                {featureLabel}
              </span>
            ))
          )}

          {hiddenFeatureLabelsCount > 0 && (
            <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-xs text-neutral-700">
              +{hiddenFeatureLabelsCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
