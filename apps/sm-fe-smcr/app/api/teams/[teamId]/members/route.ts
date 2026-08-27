import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memberTeams, members, teams } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";

function getValidIds(
  memberId: unknown,
  teamId: string,
): { memberId: number; teamId: number } | null {
  const parsedMemberId = Number(memberId);
  const parsedTeamId = Number(teamId);

  if (
    !Number.isInteger(parsedMemberId) ||
    parsedMemberId <= 0 ||
    !Number.isInteger(parsedTeamId) ||
    parsedTeamId <= 0
  ) {
    return null;
  }

  return { memberId: parsedMemberId, teamId: parsedTeamId };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { teamId } = await params;
    const ids = getValidIds(body.memberId, teamId);

    if (!ids) {
      return NextResponse.json(
        { error: "Utente o team non valido." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [[team], [member]] = await Promise.all([
      db.select({ id: teams.id }).from(teams).where(eq(teams.id, ids.teamId)).limit(1),
      db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.id, ids.memberId))
        .limit(1),
    ]);

    if (!team || !member) {
      return NextResponse.json(
        { error: "Utente o team non trovato." },
        { status: 404 },
      );
    }

    await db
      .insert(memberTeams)
      .values({ memberId: ids.memberId, teamId: ids.teamId })
      .onConflictDoNothing({
        target: [memberTeams.memberId, memberTeams.teamId],
      });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logServerError(error, "Errore API aggiunta membro al team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { teamId } = await params;
    const ids = getValidIds(body.memberId, teamId);

    if (!ids) {
      return NextResponse.json(
        { error: "Utente o team non valido." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await db
      .delete(memberTeams)
      .where(
        and(
          eq(memberTeams.memberId, ids.memberId),
          eq(memberTeams.teamId, ids.teamId),
        ),
      )
      .returning({ memberId: memberTeams.memberId });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "L'utente non fa parte di questo team." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logServerError(error, "Errore API rimozione membro dal team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
