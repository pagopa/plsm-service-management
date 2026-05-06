import { readTeams } from "@/lib/services/teams.service";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import RequestAccessForm, { TeamSelectOption } from "./request-access-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const teamsResult = await readTeams();

  if (teamsResult.error || teamsResult.data === null) {
    logServerError(teamsResult.error, "Unable to load teams for onboarding");
    return <RequestAccessForm teamOptions={[]} />;
  }

  const teamOptions: TeamSelectOption[] = teamsResult.data
    .map((team) => ({
      value: String(team.id),
      label: team.name,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "it"));

  return <RequestAccessForm teamOptions={teamOptions} />;
}
