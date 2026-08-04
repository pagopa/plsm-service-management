import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";

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
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, parsedTeamId))
      .limit(1);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(
      { ...team, id: String(team.id), image: team.icon },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
