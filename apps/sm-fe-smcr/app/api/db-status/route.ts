// /app/api/db-status/route.ts
import { NextResponse } from "next/server";
import pg from "@/lib/knex";
import { serverEnv } from "@/config/env";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export async function GET() {
  try {
    // Una query semplice per verificare la connessione
    await pg.raw("SELECT 1+1 as result");

    return NextResponse.json(
      {
        status: "online",
        host: serverEnv.DB_HOST,
      },
      { status: 200 },
    );
  } catch (error: any) {
    logServerError(error, "DB connection error");

    return NextResponse.json(
      {
        status: "offline",
        error: error.message,
        host: "Errore di connessione",
      },
      { status: 500 },
    );
  }
}
