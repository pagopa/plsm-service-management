import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    logServerInfo("CALLING API LIST USERS");
    const users = await db
      .select({
        email: members.email,
        firstname: members.firstname,
        id: members.id,
        lastname: members.lastname,
      })
      .from(members);

    return NextResponse.json(
      users.map((user) => ({
        email: user.email,
        id: String(user.id),
        name: `${user.firstname} ${user.lastname}`.trim(),
      })),
      { status: 200 },
    );
  } catch (error) {
    logServerError(error, "Errore API LIST user");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
