import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import knex from "@/lib/knex";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    logServerInfo("Delete team requested", { teamId });

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    // Recupera il nome del team
    const team = await knex("team").where({ id: teamId }).first();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verifica se il team è "Admin"
    if (team.name === "Admin") {
      return NextResponse.json(
        { error: "Cannot delete the Admin team" },
        { status: 403 },
      );
    }

    // Se il team non è "Admin", procedi con la cancellazione
    const result = await knex("team").where({ id: teamId }).del();

    logServerInfo("Delete team result", { result });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logServerError(error, "Errore API delete team");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
