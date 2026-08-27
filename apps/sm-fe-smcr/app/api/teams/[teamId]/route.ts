import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { teamId } = await params;
    const parsedTeamId = Number(teamId);
    const status = body.status;

    if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
      return NextResponse.json(
        { error: "Team non valido." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (status !== undefined) {
      if (status !== "active" && status !== "inactive") {
        return NextResponse.json(
          { error: "Stato team non valido." },
          { status: 400 },
        );
      }

      const [team] = await db
        .update(teams)
        .set({ status, updatedAt: new Date() })
        .where(eq(teams.id, parsedTeamId))
        .returning();

      if (!team) {
        return NextResponse.json(
          { error: "Team non trovato." },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { data: { ...team, id: String(team.id) } },
        { status: 200 },
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : null;
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const department =
      typeof body.department === "string" ? body.department.trim() : null;

    if (name === null || description === null || department === null) {
      return NextResponse.json(
        { error: "Dati team non validi." },
        { status: 400 },
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Il nome deve contenere da 2 a 100 caratteri." },
        { status: 400 },
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: "La descrizione non può superare 500 caratteri." },
        { status: 400 },
      );
    }

    if (department.length > 100) {
      return NextResponse.json(
        { error: "Il reparto non può superare 100 caratteri." },
        { status: 400 },
      );
    }

    const [team] = await db
      .update(teams)
      .set({
        department: department || null,
        description: description || null,
        name,
        updatedAt: new Date(),
      })
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const parsedTeamId = Number(teamId);

    if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
      return NextResponse.json(
        { error: "Team non valido." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deletedTeam] = await db
      .delete(teams)
      .where(eq(teams.id, parsedTeamId))
      .returning({ id: teams.id });

    if (!deletedTeam) {
      return NextResponse.json({ error: "Team non trovato." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logServerError(error, "Errore API eliminazione team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
