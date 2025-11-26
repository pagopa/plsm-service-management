import { NextResponse, type NextRequest } from "next/server";
import knex from "@/lib/knex";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const body = await req.json();
  const { userId, role } = body;

  const { teamId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    await knex("member").insert({
      id: randomUUID(),
      userId,
      teamId,
      role,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
