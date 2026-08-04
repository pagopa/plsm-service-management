import { type NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Invalid team name" }, { status: 400 });
    }

    const [team] = await db
      .insert(teams)
      .values({
        name,
        slug: slugify(name, { lower: true, strict: true }),
      })
      .returning();

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
