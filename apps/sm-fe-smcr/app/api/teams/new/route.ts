import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import slugify from "slugify";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const imageFile = formData.get("image");

    if (name.length < 2) {
      return NextResponse.json({ error: "Invalid team name" }, { status: 400 });
    }

    let icon: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      const resizedImage = await sharp(await imageFile.arrayBuffer())
        .resize(256, 256, { fit: "inside", withoutEnlargement: true })
        .toBuffer();
      icon = `data:${imageFile.type};base64,${resizedImage.toString("base64")}`;
    }

    const [team] = await db
      .insert(teams)
      .values({
        icon,
        name,
        slug: slugify(name, { lower: true, strict: true }),
      })
      .returning();

    return NextResponse.json(
      {
        data: team ? [{ ...team, id: String(team.id), image: team.icon }] : [],
      },
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
