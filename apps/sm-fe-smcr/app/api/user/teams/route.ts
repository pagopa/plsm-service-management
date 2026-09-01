import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { memberTeams, members, teams } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedUserId = request.nextUrl.searchParams.get("userId");
    if (requestedUserId && requestedUserId !== currentUser.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();
    const memberId = Number(currentUser.user.id);
    const rows = await db
      .select({
        email: members.email,
        firstname: members.firstname,
        lastname: members.lastname,
        teamId: teams.id,
        teamName: teams.name,
      })
      .from(members)
      .innerJoin(memberTeams, eq(members.id, memberTeams.memberId))
      .innerJoin(teams, eq(memberTeams.teamId, teams.id))
      .where(eq(members.id, memberId));

    return NextResponse.json(
      {
        teams: rows.map((row) => ({
          id: String(row.teamId),
          name: row.teamName,
          role: "member" as const,
        })),
        user: {
          email: currentUser.user.email,
          id: currentUser.user.id,
          name: currentUser.user.name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    logServerError(error, "Errore API user team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
