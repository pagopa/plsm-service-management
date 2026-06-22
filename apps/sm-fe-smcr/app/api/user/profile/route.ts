import { NextResponse } from "next/server";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";
import { logServerError } from "@/lib/logger/logger.server.helpers";

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
//     logServerError(error, "Errore API profile");
//     res.status(500).json({ error: "Errore interno del server" });
//   }
// }
