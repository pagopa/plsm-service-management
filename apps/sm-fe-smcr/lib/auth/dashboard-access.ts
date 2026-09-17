import "server-only";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  memberTeams,
  members,
  permissions,
  teamPermissions,
  teams,
} from "@/db/schema";
import type {
  DashboardNavigationItem,
  DashboardNavigationSection,
} from "@/lib/dashboard-navigation";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { getOrCreateCurrentAppUser, requireServerSession } from "./server";

export async function getCurrentPermissionCodes(): Promise<Set<string>> {
  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return new Set();
    }

    const db = getDb();
    const permissionRows = await db
      .selectDistinct({ code: permissions.code })
      .from(members)
      .innerJoin(memberTeams, eq(members.id, memberTeams.memberId))
      .innerJoin(teams, eq(memberTeams.teamId, teams.id))
      .innerJoin(teamPermissions, eq(teams.id, teamPermissions.teamId))
      .innerJoin(permissions, eq(teamPermissions.permissionId, permissions.id))
      .where(
        and(
          eq(members.id, Number(currentUser.user.id)),
          eq(members.status, "active"),
          eq(teams.status, "active"),
          eq(permissions.status, "active"),
        ),
      );

    return new Set(permissionRows.map((permission) => permission.code));
  } catch (error) {
    logServerError(error, "getCurrentPermissionCodes - database error");
    throw error;
  }
}

export async function hasCurrentPermission(
  permissionCode: string,
): Promise<boolean> {
  const permissionCodes = await getCurrentPermissionCodes();
  return permissionCodes.has(permissionCode);
}

export async function requireDashboardPermission(
  permissionCode: string,
  returnUrl: string,
): Promise<void> {
  await requireServerSession(returnUrl);

  if (!(await hasCurrentPermission(permissionCode))) {
    redirect("/dashboard");
  }
}

function filterNavigationItems(
  items: DashboardNavigationItem[],
  permissionCodes: ReadonlySet<string>,
): DashboardNavigationItem[] {
  return items.flatMap((item) => {
    if (item.children) {
      const children = filterNavigationItems(item.children, permissionCodes);
      return children.length > 0 ? [{ ...item, children }] : [];
    }

    if (!item.permission || permissionCodes.has(item.permission)) {
      return [item];
    }

    return [];
  });
}

export function filterDashboardNavigation(
  sections: DashboardNavigationSection[],
  permissionCodes: ReadonlySet<string>,
): DashboardNavigationSection[] {
  return sections.flatMap((section) => {
    const items = filterNavigationItems(section.items, permissionCodes);
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}
