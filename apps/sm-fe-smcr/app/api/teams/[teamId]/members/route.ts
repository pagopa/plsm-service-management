import { NextRequest, NextResponse } from "next/server";
import knex from "@/lib/knex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
  }

  try {
    const members = await knex("user as u")
      .select(
        "m.id",
        "u.id as userId",
        "u.name",
        "u.email",
        "m.role",
        "t.name as teamName",
        "t.id as teamId",
      )
      .join("member as m", "u.id", "m.userId")
      .join("team as t", "m.teamId", "t.id")
      .where("t.id", teamId);

    return NextResponse.json(members, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
