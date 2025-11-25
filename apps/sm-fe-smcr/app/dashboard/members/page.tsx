export const dynamic = "force-dynamic";

import MembersStoreDispatcher from "@/components/members/members-store-dispatcher";
import { columns, MembersTable } from "@/components/members/table";
import TeamsStoreDispatcher from "@/components/teams/teams-store-dispatcher";
import { readMembers } from "@/lib/services/members.service";
import { readTeams } from "@/lib/services/teams.service";
import { UsersIcon } from "lucide-react";

export default async function Page() {
  const members = await readMembers();
  if (members.error || members.data === null) {
    console.error(members.error);
    throw new Error(members.error);
  }

  const teams = await readTeams();
  if (teams.error || teams.data === null) {
    console.error(teams.error);
    throw new Error(teams.error);
  }

  return (
    <div className="bg-white h-full w-full p-2">
      <MembersStoreDispatcher members={members.data} />
      <TeamsStoreDispatcher teams={teams.data} features={[]} />

      <div className="inline-flex items-center justify-between w-full border-b p-2">
        <div className="inline-flex gap-2 items-center">
          <UsersIcon className="size-4 opacity-60" />
          <h1 className="font-medium text-lg">Utenti</h1>
        </div>

        {/* <NewTeamDialog /> */}
      </div>

      <MembersTable columns={columns} data={members.data} />
    </div>
  );
}
