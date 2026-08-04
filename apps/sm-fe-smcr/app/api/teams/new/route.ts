import { type NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { db } from "@/db";
import { memberTeams, teams } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const department = String(formData.get("department") ?? "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Invalid team name" }, { status: 400 });
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const createdByMemberId = Number(currentUser.user.id);
    const team = await db.transaction(async (transaction) => {
      const [createdTeam] = await transaction
        .insert(teams)
        .values({
          createdByMemberId,
          department: department || null,
          description: description || null,
          name,
          slug: slugify(name, { lower: true, strict: true }),
        })
        .returning();

      if (createdTeam) {
        await transaction.insert(memberTeams).values({
          memberId: createdByMemberId,
          teamId: createdTeam.id,
        });
      }

      return createdTeam;
    });

    return NextResponse.json(
      { data: team ? [{ ...team, id: String(team.id) }] : [] },
      { status: 201 },
    );
  } catch (error) {
    logServerError(error, "Errore API team");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
