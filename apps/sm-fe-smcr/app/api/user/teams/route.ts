import { NextRequest, NextResponse } from "next/server";
import pg from "@/lib/knex";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const getUserWithTeamsByEmail = await pg("user as u")
      .select(
        "u.id",
        "u.name",
        "u.email",
        "m.role",
        "t.name as teamName",
        "t.id as teamId",
      )
      .join("member as m", "u.id", "m.userId")
      .join("team as t", "m.teamId", "t.id")
      .where("u.id", userId)
      .then((rows: any) => {
        if (rows.length === 0) return null;

        return {
          user: {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
          },
          teams: rows.map((row: any) => ({
            id: row.teamId,
            name: row.teamName,
            role: row.role
          })),
        };
      });

    return NextResponse.json(getUserWithTeamsByEmail, { status: 200 });
  } catch (error) {
    console.error("Errore API user team:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
