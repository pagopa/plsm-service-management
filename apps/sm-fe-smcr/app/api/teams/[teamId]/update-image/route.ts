import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const parsedTeamId = Number(teamId);
  const imageFile = (await request.formData()).get("image");

  if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
    return NextResponse.json({ error: "Invalid teamId" }, { status: 400 });
  }

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json(
      { error: "File immagine mancante" },
      { status: 400 },
    );
  }

  try {
    const resizedImage = await sharp(await imageFile.arrayBuffer())
      .resize(256, 256, { fit: "inside", withoutEnlargement: true })
      .toBuffer();
    const icon = `data:${imageFile.type};base64,${resizedImage.toString("base64")}`;

    const updated = await db
      .update(teams)
      .set({ icon, updatedAt: new Date() })
      .where(eq(teams.id, parsedTeamId))
      .returning({ id: teams.id });

    if (updated.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError(error, "Errore aggiornamento immagine team");
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
