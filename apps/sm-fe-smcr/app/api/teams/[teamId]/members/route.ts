import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memberTeams, members, teams } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const parsedTeamId = Number(teamId);

  if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
    return NextResponse.json({ error: "Invalid teamId" }, { status: 400 });
  }

  try {
    const rows = await db
      .select({
        email: members.email,
        firstname: members.firstname,
        lastname: members.lastname,
        teamId: teams.id,
        teamName: teams.name,
        userId: members.id,
      })
      .from(memberTeams)
      .innerJoin(members, eq(memberTeams.memberId, members.id))
      .innerJoin(teams, eq(memberTeams.teamId, teams.id))
      .where(eq(memberTeams.teamId, parsedTeamId));

    return NextResponse.json(
      rows.map((row) => ({
        email: row.email,
        id: String(row.userId),
        name: `${row.firstname} ${row.lastname}`.trim(),
        role: "member" as const,
        teamId: String(row.teamId),
        teamName: row.teamName,
        userId: String(row.userId),
      })),
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
