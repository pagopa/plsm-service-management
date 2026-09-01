import { type NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { permissions } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";

const permissionCodePattern = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/;

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const databaseError = error as {
    cause?: { code?: string };
    code?: string;
  };

  return databaseError.code === "23505" || databaseError.cause?.code === "23505";
}

export async function GET() {
  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const result = await db.select().from(permissions).orderBy(asc(permissions.code));

    return NextResponse.json(
      { data: result.map((permission) => ({ ...permission, id: String(permission.id) })) },
      { status: 200 },
    );
  } catch (error) {
    logServerError(error, "Errore API lista permessi");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toLowerCase();
    const description = String(body.description ?? "").trim();

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Il nome deve contenere da 2 a 100 caratteri." },
        { status: 400 },
      );
    }

    if (!permissionCodePattern.test(code)) {
      return NextResponse.json(
        {
          error:
            "Il codice deve usare parole minuscole separate da punti, ad esempio overview.read.",
        },
        { status: 400 },
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: "La descrizione non può superare 500 caratteri." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const [permission] = await db
      .insert(permissions)
      .values({
        code,
        description: description || null,
        name,
      })
      .returning();

    return NextResponse.json(
      { data: permission ? { ...permission, id: String(permission.id) } : null },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Esiste già un permesso con questo codice." },
        { status: 409 },
      );
    }

    logServerError(error, "Errore API creazione permesso");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
