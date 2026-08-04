import { mockTeams } from "@/components/teams/mock/mock-data";
import {
  TeamManagementBreadcrumb,
  TeamsListView,
} from "@/components/teams/mock/team-management-ui";

export default function Page() {
  return (
    <div className="min-h-full w-full bg-white">
      <TeamManagementBreadcrumb />
      <TeamsListView teams={mockTeams} />
    </div>
  );
}
