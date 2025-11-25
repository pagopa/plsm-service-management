import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import knex from "@/lib/knex";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    console.log("CANCELLOOOO", teamId);

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

    console.log("Delete team result:", result);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Errore API delete -team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
