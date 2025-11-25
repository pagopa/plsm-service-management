import { NextResponse } from "next/server";
import pg from "@/lib/knex";

export async function GET() {
  try {
    console.log("CALLING API LIST TEAMS");
    const teams = await pg.select().table("team");

    return NextResponse.json(teams, { status: 200 });
  } catch (error) {
    console.error("Errore API team:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
