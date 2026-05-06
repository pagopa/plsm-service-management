import { NextResponse } from "next/server";
import pg from "@/lib/knex";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function GET() {
  try {
    logServerInfo("CALLING API LIST USERS");
    const users = await pg.select().table("user");

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    logServerError(error, "Errore API LIST user");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
