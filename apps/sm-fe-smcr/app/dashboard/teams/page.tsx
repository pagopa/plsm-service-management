import {
  TeamManagementBreadcrumb,
  TeamsListView,
} from "@/components/teams/mock/team-management-ui";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { readTeamsList } from "@/lib/services/teams.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const teams = await readTeamsList();

  if (teams.error || teams.data === null) {
    logServerError(teams.error, "Teams page - read teams error");
    throw new Error("Impossibile caricare i team.");
  }

  return (
    <div className="min-h-full w-full bg-white">
      <TeamManagementBreadcrumb />
      <TeamsListView
        teams={teams.data.map((team) => ({
          description: team.description,
          id: team.id,
          memberCount: team.memberCount,
          name: team.name,
          status: team.status,
        }))}
      />
    </div>
  );
}
