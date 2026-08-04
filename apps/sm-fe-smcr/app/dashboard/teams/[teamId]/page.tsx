import { getMockTeamById } from "@/components/teams/mock/mock-data";
import {
  TeamDetailView,
  TeamManagementBreadcrumb,
} from "@/components/teams/mock/team-management-ui";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ teamId: string }>;
};

export default async function Page({ params }: Props) {
  const { teamId } = await params;
  const team = getMockTeamById(teamId);

  if (!team) {
    notFound();
  }

  return (
    <div className="min-h-full w-full bg-white">
      <TeamManagementBreadcrumb />
      <TeamDetailView team={team} />
    </div>
  );
}
