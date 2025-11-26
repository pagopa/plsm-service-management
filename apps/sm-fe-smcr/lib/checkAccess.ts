import { UserProfile } from "@/lib/types/userProfile";
import { protectedRoutes } from "@/lib/protectedRoutes";

export function hasAccess(user: UserProfile | null, path: string): boolean {
  // Find matching route (handle both exact paths and dynamic routes)
  const route = protectedRoutes.find(
    (r) => r.path === path || path.startsWith(r.path + "/"),
  );

  // No route definition = public access
  if (!route) return true;

  // Route requires authentication
  if (!user) return false;

  // No team restrictions = authenticated users can access
  if (!route.requiredTeams || route.requiredTeams.length === 0) {
    return true;
  }

  // Check if user is member of ANY required team (not just activeTeam)
  const userTeamNames = user.membersOf?.map((member) => member.team.name) || [];

  return route.requiredTeams.some((requiredTeam) =>
    userTeamNames.includes(requiredTeam),
  );
}

// Helper function to check specific team access
export function hasTeamAccess(
  user: UserProfile | null,
  teamName: string,
): boolean {
  if (!user) return false;
  const userTeamNames = user.membersOf?.map((member) => member.team.name) || [];
  return userTeamNames.includes(teamName);
}
