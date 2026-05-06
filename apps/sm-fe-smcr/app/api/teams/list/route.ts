import { NextResponse } from "next/server";
import pg from "@/lib/knex";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function GET() {
  try {
    logServerInfo("CALLING API LIST TEAMS");
    const teams = await pg.select().table("team");

    return NextResponse.json(teams, { status: 200 });
  } catch (error) {
    logServerError(error, "Errore API team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
