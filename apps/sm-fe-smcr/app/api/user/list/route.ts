import { NextResponse } from "next/server";
import pg from "@/lib/knex";

export async function GET() {
  try {
    console.log("CALLING API LIST USERS");
    const users = await pg.select().table("user");

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Errore API LIST user:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
