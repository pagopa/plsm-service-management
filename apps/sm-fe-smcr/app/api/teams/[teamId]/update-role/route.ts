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
    const { memberId, role } = await req.json();
    // const { teamId } = await params;
    logServerInfo("Received update role params", { memberId, role });

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "Missing id or role" },
        { status: 400 },
      );
    }

    logServerInfo("Update role requested", { memberId, role });

    const result = await knex("member")
      .where({ id: memberId })
      .update({ role });

    logServerInfo("Update role result", { result });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logServerError(error, "Errore API update-role");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
