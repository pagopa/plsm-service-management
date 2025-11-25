// app/api/teams/new/route.ts
import { NextRequest, NextResponse } from "next/server";
import pg from "@/lib/knex";
import { randomUUID } from "crypto";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;

    let imageUrl: string | null = null;

    if (imageFile) {
      // Converti l'immagine in buffer
      const buffer = await imageFile.arrayBuffer();

      // Ridimensiona l'immagine a max 256x256 mantenendo le proporzioni
      const resizedImage = await sharp(buffer)
        .resize(256, 256, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .toBuffer();

      // Converti in base64
      imageUrl = `data:${imageFile.type};base64,${resizedImage.toString("base64")}`;
    }

    const team = await pg("team")
      .insert({
        id: randomUUID(),
        name,
        image: imageUrl,
        createdAt: pg.fn.now(),
        updatedAt: pg.fn.now(),
      })
      .returning("*");

    return NextResponse.json({ data: team }, { status: 201 });
  } catch (error) {
    console.error("Errore API team:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
