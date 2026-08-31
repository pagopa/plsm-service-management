import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getServerSession } from "@/lib/auth/server";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";

const responseInit = (status: number): ResponseInit => ({
  headers: { "Cache-Control": "no-store" },
  status,
});

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, responseInit(401));
  }

  try {
    const db = getDb();
    await db.execute(sql`select 1`);

    logServerInfo("Database connectivity check succeeded", {
      event: "database.connectivity.ok",
    });

    return NextResponse.json({ status: "online" }, responseInit(200));
  } catch (error) {
    logServerError(error, "Database connectivity check failed", {
      event: "database.connectivity.error",
    });

    return NextResponse.json({ status: "offline" }, responseInit(503));
  }
}
