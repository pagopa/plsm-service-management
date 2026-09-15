import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { permissions } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { hasPermission } from "@/lib/auth/permissions";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ permissionId: string }> },
) {
  try {
    const { permissionId } = await params;
    const parsedPermissionId = Number(permissionId);

    if (!Number.isInteger(parsedPermissionId) || parsedPermissionId <= 0) {
      return NextResponse.json(
        { error: "Permesso non valido." },
        { status: 400 },
      );
    }

    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission("permissions.manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();
    const [permission] = await db
      .update(permissions)
      .set({ status: "archived", updatedAt: new Date() })
      .where(
        and(
          eq(permissions.id, parsedPermissionId),
          eq(permissions.status, "active"),
        ),
      )
      .returning({ id: permissions.id });

    if (!permission) {
      return NextResponse.json(
        { error: "Permesso non trovato." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logServerError(error, "Errore API archiviazione permesso");
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
