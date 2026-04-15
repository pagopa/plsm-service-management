import { NextRequest, NextResponse } from "next/server";
import knex from "@/lib/knex";
import { randomUUID } from "crypto";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedUserId = request.nextUrl.searchParams.get("userId");
    const userId = currentUser.user.id;

    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const preferences = await knex("preferences")
      .select("team_id as teamId", "color_mode as theme")
      .where({ user_id: userId });

    if (preferences.length <= 0) {
      await knex("preferences").insert({
        id: randomUUID(),
        user_id: userId,
        color_mode: "light",
      });
      const preferences = await knex("preferences")
        .select("team_id as teamId", "color_mode as theme")
        .where({ user_id: userId });
      return NextResponse.json(preferences[0], { status: 201 });
    }
    return NextResponse.json(preferences[0], { status: 200 });
  } catch (error) {
    console.error("Errore API get preferences:", error);
    return NextResponse.json(
      { error: `Errore interno del server ${error}` },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { theme, teamId } = await request.json();
    const requestedUserId = request.nextUrl.searchParams.get("userId");
    const userId = currentUser.user.id;

    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Log utile per debug
    console.log("Aggiornamento preferenze:", { userId, teamId, theme });

    // Esegui UPDATE con await
    const result = await knex("preferences")
      .where("user_id", userId)
      .update(
        {
          ...(teamId !== undefined && { team_id: teamId }),
          ...(theme !== undefined && { color_mode: theme }),
        },
        ["user_id", "team_id", "color_mode"],
      );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Nessuna preferenza aggiornata" },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: 200, updated: result[0] });
  } catch (error) {
    console.error("Errore API PATCH /user/preferences:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
