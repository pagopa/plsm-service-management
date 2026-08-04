import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memberTeams } from "@/db/schema";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { memberId } = await request.json();
    const { teamId } = await params;
    const membershipId = Number(memberId);
    const parsedTeamId = Number(teamId);

    if (
      !Number.isInteger(membershipId) ||
      membershipId <= 0 ||
      !Number.isInteger(parsedTeamId) ||
      parsedTeamId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid memberId or teamId" },
        { status: 400 },
      );
    }

    const deleted = await db
      .delete(memberTeams)
      .where(
        and(
          eq(memberTeams.id, membershipId),
          eq(memberTeams.teamId, parsedTeamId),
        ),
      )
      .returning({ id: memberTeams.id });

    logServerInfo("Delete member result", { count: deleted.length });
    return NextResponse.json({ success: deleted.length > 0 });
  } catch (error) {
    logServerError(error, "Errore API remove-user");
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
