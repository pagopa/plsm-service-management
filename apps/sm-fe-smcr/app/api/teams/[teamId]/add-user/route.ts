import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memberTeams } from "@/db/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { userId } = await request.json();
  const { teamId } = await params;
  const memberId = Number(userId);
  const parsedTeamId = Number(teamId);

  if (
    !Number.isInteger(memberId) ||
    memberId <= 0 ||
    !Number.isInteger(parsedTeamId) ||
    parsedTeamId <= 0
  ) {
    return NextResponse.json(
      { error: "Invalid userId or teamId" },
      { status: 400 },
    );
  }

  try {
    await db
      .insert(memberTeams)
      .values({ memberId, teamId: parsedTeamId })
      .onConflictDoNothing({
        target: [memberTeams.memberId, memberTeams.teamId],
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
