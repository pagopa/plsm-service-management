import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import knex from "@/lib/knex";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export async function POST(
  req: NextRequest,
  // { params }: { params: Promise<{ teamId: string }> }, // Destructuring diretto
) {
  try {
    const { memberId } = await req.json();
    // const { teamId } = await params; // Await dei params

    if (!memberId) {
      return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
    }

    const result = await knex("member").where({ id: memberId }).del();

    logServerInfo("Delete member result", { result });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logServerError(error, "Errore API remove-user");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
