import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberTeams, members, permissions, teamPermissions, teams } from "@/db/schema";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { getOrCreateCurrentAppUser, requireServerSession } from "./server";

export async function hasPermission(permissionCode: string): Promise<boolean> {
  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return false;
    }

    const memberId = Number(currentUser.user.id);
    const [matchingPermission] = await db
      .select({ id: permissions.id })
      .from(members)
      .innerJoin(memberTeams, eq(members.id, memberTeams.memberId))
      .innerJoin(teams, eq(memberTeams.teamId, teams.id))
      .innerJoin(teamPermissions, eq(teams.id, teamPermissions.teamId))
      .innerJoin(permissions, eq(teamPermissions.permissionId, permissions.id))
      .where(
        and(
          eq(members.id, memberId),
          eq(members.status, "active"),
          eq(teams.status, "active"),
          eq(permissions.code, permissionCode),
          eq(permissions.status, "active"),
        ),
      )
      .limit(1);

    return Boolean(matchingPermission);
  } catch (error) {
    logServerError(error, "hasPermission - database error");
    throw error;
  }
}

export async function checkPermission(
  permissionCode: string,
  returnUrl: string,
): Promise<boolean> {
  await requireServerSession(returnUrl);

  return hasPermission(permissionCode);
}
