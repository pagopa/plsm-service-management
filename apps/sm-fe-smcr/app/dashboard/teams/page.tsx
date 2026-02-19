export const dynamic = "force-dynamic";

import { TeamsGrid } from "@/components/teams/cards";
import { NewTeamDialog } from "@/components/teams/new-team";
import TeamsStoreDispatcher from "@/components/teams/teams-store-dispatcher";
import {
  readPermissions,
  readTeamMemberCounts,
  readTeams,
} from "@/lib/services/teams.service";
import { UsersIcon } from "lucide-react";

export default async function Page() {
  const [teams, features, teamMemberCounts] = await Promise.all([
    readTeams(),
    readPermissions(),
    readTeamMemberCounts(),
  ]);

  if (teams.error || teams.data === null) {
    console.error(teams.error);
    throw new Error(teams.error);
  }

  if (features.error || features.data === null) {
    console.error(features.error);
    throw new Error(features.error);
  }

  if (teamMemberCounts.error || teamMemberCounts.data === null) {
    console.error(teamMemberCounts.error);
    throw new Error(teamMemberCounts.error);
  }

  const teamsForGrid = teams.data.map((team) => {
    const teamPermissionIds = new Set(team.permissions);
    const featureLabels = features.data
      .filter((feature) =>
        feature.permissions.some((permission) =>
          teamPermissionIds.has(permission.id),
        ),
      )
      .map((feature) => feature.name);

    return {
      ...team,
      memberCount: teamMemberCounts.data[team.id] ?? 0,
      featureLabels,
    };
  });

  return (
    <div className="bg-white h-full w-full p-2">
      <TeamsStoreDispatcher teams={teams.data} features={features.data} />
      <div className="inline-flex items-center justify-between w-full border-b p-2">
        <div className="inline-flex gap-2 items-center">
          <UsersIcon className="size-4 opacity-60" />
          <h1 className="font-medium text-lg">Teams</h1>
        </div>

        <NewTeamDialog />
      </div>

      <TeamsGrid teams={teamsForGrid} />
    </div>
  );
}
