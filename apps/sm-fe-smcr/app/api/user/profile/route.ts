// App Router: app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import pg from "@/lib/knex";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Query database
    const result = await pg
      .select("id")
      .from<{ id: string }>("user")
      .where("email", email);

    if (!result || result.length === 0) {
      const [insertedId] = await pg("user")
        .insert({
          id: randomUUID(),
          name: name,
          email: email,
          createdAt: pg.fn.now(),
          updatedAt: pg.fn.now(),
        })
        .returning("id"); // Restituisce solo l'ID

      return NextResponse.json({ data: insertedId }, { status: 201 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Errore API profile:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// Pages Router: pages/api/user/profile.ts
// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse,
// ) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Metodo non consentito" });
//   }

//   try {
//     const { email } = req.body;

//     // Query al database
//     const user = await db.user.findUnique({
//       where: { email },
//       // ... resto della query
//     });

//     if (!user) {
//       return res.status(404).json({ error: "Utente non trovato" });
//     }

//     res.json(user);
//   } catch (error) {
//     console.error("Errore API profile:", error);
//     res.status(500).json({ error: "Errore interno del server" });
//   }
// }
