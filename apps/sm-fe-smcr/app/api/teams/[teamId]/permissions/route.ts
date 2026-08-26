import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { permissions, teamPermissions, teams } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const permissionId = Number(body.permissionId);
    const { teamId } = await params;
    const parsedTeamId = Number(teamId);

    if (
      !Number.isInteger(permissionId) ||
      permissionId <= 0 ||
      !Number.isInteger(parsedTeamId) ||
      parsedTeamId <= 0
    ) {
      return NextResponse.json(
        { error: "Team o permesso non valido." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [[team], [permission]] = await Promise.all([
      db.select({ id: teams.id }).from(teams).where(eq(teams.id, parsedTeamId)).limit(1),
      db
        .select({ id: permissions.id })
        .from(permissions)
        .where(
          and(
            eq(permissions.id, permissionId),
            eq(permissions.status, "active"),
          ),
        )
        .limit(1),
    ]);

    if (!team) {
      return NextResponse.json({ error: "Team non trovato." }, { status: 404 });
    }

    if (!permission) {
      return NextResponse.json(
        { error: "Il permesso non è disponibile." },
        { status: 400 },
      );
    }

    await db
      .insert(teamPermissions)
      .values({ permissionId, teamId: parsedTeamId })
      .onConflictDoNothing({
        target: [teamPermissions.teamId, teamPermissions.permissionId],
      });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logServerError(error, "Errore API assegnazione permesso al team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
