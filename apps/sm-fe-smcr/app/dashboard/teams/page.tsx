export const dynamic = "force-dynamic";

import { NewTeamDialog } from "@/components/teams/new-team";
import { columns, TeamsTable } from "@/components/teams/table";
import TeamsStoreDispatcher from "@/components/teams/teams-store-dispatcher";
import { readPermissions, readTeams } from "@/lib/services/teams.service";
import { UsersIcon } from "lucide-react";

export default async function Page() {
  const teams = await readTeams();
  const features = await readPermissions();

  if (teams.error || teams.data === null) {
    console.error(teams.error);
    throw new Error(teams.error);
  }

  if (features.error || features.data === null) {
    console.error(features.error);
    throw new Error(features.error);
  }

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

      <TeamsTable columns={columns} data={teams.data} />
    </div>
  );
}
