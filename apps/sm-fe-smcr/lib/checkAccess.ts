import { UserProfile } from "@/lib/types/userProfile";
import { protectedRoutes } from "@/lib/protectedRoutes";

function findRouteForPath(path: string) {
  for (const route of protectedRoutes) {
    if (route.path && (route.path === path || path.startsWith(route.path + "/"))) {
      return route;
    }

    const child = route.children?.find(
      (c) => c.path === path || path.startsWith(c.path + "/"),
    );
    if (child) {
      return child;
    }
  }

  return undefined;
}

export function hasAccess(user: UserProfile | null, path: string): boolean {
  const route = findRouteForPath(path);

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
