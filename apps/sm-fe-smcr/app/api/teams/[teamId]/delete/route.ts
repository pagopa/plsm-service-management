import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const parsedTeamId = Number(teamId);

    if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
      return NextResponse.json({ error: "Invalid teamId" }, { status: 400 });
    }

    const [team] = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.id, parsedTeamId))
      .limit(1);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.name === "Admin") {
      return NextResponse.json(
        { error: "Cannot delete the Admin team" },
        { status: 403 },
      );
    }

    const deleted = await db
      .delete(teams)
      .where(eq(teams.id, parsedTeamId))
      .returning({ id: teams.id });

    logServerInfo("Delete team result", { count: deleted.length });
    return NextResponse.json({ success: deleted.length > 0 });
  } catch (error) {
    logServerError(error, "Errore API delete team");
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
