import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import knex from "@/lib/knex";

export async function POST(
  req: NextRequest,
  // { params }: { params: Promise<{ teamId: string }> }, // Destructuring diretto
) {
  try {
    const { memberId, role } = await req.json();
    // const { teamId } = await params;
    console.log("Received params:", { memberId, role }); // Debug

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "Missing id or role" },
        { status: 400 },
      );
    }

    console.log(`UPDATE ROLE: id=${memberId}, role=${role}`);

    const result = await knex("member")
      .where({ id: memberId })
      .update({ role });

    console.log("Update result:", result);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Errore API update-role:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
