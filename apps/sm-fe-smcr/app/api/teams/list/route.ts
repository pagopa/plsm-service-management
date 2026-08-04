import { NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function GET() {
  try {
    logServerInfo("CALLING API LIST TEAMS");
    const rows = await db.select().from(teams);

    return NextResponse.json(
      rows.map((team) => ({
        ...team,
        id: String(team.id),
        image: team.icon,
      })),
      { status: 200 },
    );
  } catch (error) {
    logServerError(error, "Errore API team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
