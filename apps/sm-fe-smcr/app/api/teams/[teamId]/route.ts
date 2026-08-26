import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

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

    return NextResponse.json({ ...team, id: String(team.id) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { teamId } = await params;
    const parsedTeamId = Number(teamId);
    const status = body.status;

    if (
      !Number.isInteger(parsedTeamId) ||
      parsedTeamId <= 0 ||
      (status !== "active" && status !== "inactive")
    ) {
      return NextResponse.json(
        { error: "Team o stato non valido." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [team] = await db
      .update(teams)
      .set({ status, updatedAt: new Date() })
      .where(eq(teams.id, parsedTeamId))
      .returning();

    if (!team) {
      return NextResponse.json({ error: "Team non trovato." }, { status: 404 });
    }

    return NextResponse.json(
      { data: { ...team, id: String(team.id) } },
      { status: 200 },
    );
  } catch (error) {
    logServerError(error, "Errore API aggiornamento stato team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
