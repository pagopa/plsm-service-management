import {
  TeamDetailView,
  TeamManagementBreadcrumb,
} from "@/components/teams/mock/team-management-ui";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { readTeamDetail } from "@/lib/services/teams.service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ teamId: string }>;
};

export default async function Page({ params }: Props) {
  const { teamId } = await params;
  const parsedTeamId = Number(teamId);

  if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
    notFound();
  }

  const team = await readTeamDetail(parsedTeamId);

  if (team.error === "not found") {
    notFound();
  }

  if (team.error || team.data === null) {
    logServerError(team.error, "Team detail page - read team error");
    throw new Error("Impossibile caricare il team.");
  }

  return (
    <div className="min-h-full w-full bg-white">
      <TeamManagementBreadcrumb />
      <TeamDetailView team={team.data} />
    </div>
  );
}
