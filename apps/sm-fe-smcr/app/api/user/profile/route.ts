import { NextResponse } from "next/server";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getCurrentProfileResponse() {
  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { data: currentUser.user },
      { status: currentUser.created ? 201 : 200 },
    );
  } catch (error) {
    logServerError(error, "Errore API profile");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return getCurrentProfileResponse();
}

export async function POST() {
  return getCurrentProfileResponse();
}
