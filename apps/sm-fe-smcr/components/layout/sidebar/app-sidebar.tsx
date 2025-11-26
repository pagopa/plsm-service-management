"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { protectedRoutes } from "@/lib/protectedRoutes";
import { NavMain } from "../nav-main";
import { TeamSwitcher } from "./sidebar-header";
import { SidebarUser } from "./sidebar-user";
import Link from "next/link";
import { FileText } from "lucide-react";
import useAuthStore from "@/lib/store/auth.store";
import { MemberWithTeams } from "@/lib/services/members.service";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  // Crea una mappa slug -> nome team per lookup veloce
  const teamNameMap = new Map<string, string>();
  user.teams?.forEach((team) => {
    teamNameMap.set(team.slug, team.name);
  });
  // Aggiungi il gruppo "core" con un nome custom
  teamNameMap.set("core", "Core");

  const accessibleRoutes = protectedRoutes.filter(
    (route) => route.sidebar && hasAccess(user, route),
  );

  // Raggruppa le route per teamId
  const groupedRoutes = accessibleRoutes.reduce(
    (acc, route) => {
      const teamId = route.teamId || "ungrouped";
      if (!acc[teamId]) {
        acc[teamId] = [];
      }
      acc[teamId].push(route);
      return acc;
    },
    {} as Record<string, typeof accessibleRoutes>,
  );

  // Ordine preferito dei gruppi
  const groupOrder = ["core", "service-management", "admin"];
  const sortedGroups = groupOrder
    .filter((groupId) => groupedRoutes[groupId])
    .map((groupId) => ({
      teamId: groupId,
      teamName: teamNameMap.get(groupId) || groupId,
      routes: groupedRoutes[groupId] ?? [],
    }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent className="relative">
        <NavMain groups={sortedGroups} />

        <SidebarMenuItem className="absolute bottom-0">
          <Link
            href="https://plsmpitnsa.blob.core.windows.net/documentazione/smcr/Manuale%20SMCR.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SidebarMenuButton tooltip="Documentation">
              <FileText /> <span>Documentation</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function hasAccess(
  user: MemberWithTeams,
  route: { requiredTeams?: Array<string> },
): boolean {
  if (!route.requiredTeams || route.requiredTeams.length === 0) return true;
  if (!user.teams || user.teams.length === 0) return false;

  const userTeamSlugs = user.teams.map((team) => team.slug);
  return route.requiredTeams.some((requiredSlug) =>
    userTeamSlugs.includes(requiredSlug),
  );
}
