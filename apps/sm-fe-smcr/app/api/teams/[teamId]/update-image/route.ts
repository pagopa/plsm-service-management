// app/api/teams/[teamId]/update-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import knex from "@/lib/knex";
import sharp from "sharp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

  const formData = await request.formData();
  const imageFile = formData.get("image") as File | null;
  console.log(formData);
  if (!imageFile) {
    return NextResponse.json(
      { error: "File immagine mancante" },
      { status: 400 },
    );
  }

  try {
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

    // Salva la stringa Base64 nel database
    await knex("team").where({ id: teamId }).update({ image: imageUrl });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore aggiornamento immagine team:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
