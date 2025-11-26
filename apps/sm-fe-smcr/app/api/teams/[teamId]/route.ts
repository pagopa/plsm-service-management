import { NextRequest, NextResponse } from "next/server";
import knex from "@/lib/knex";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }, // Destructuring diretto
) {
  try {
    const { teamId } = await params;
    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    const team = await knex.select().table("team").where("id", teamId);

    return NextResponse.json(team[0], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
