// import { NextRequest, NextResponse } from "next/server";
// import pg from "@/lib/knex";
// import { randomUUID } from "crypto";
// export async function POST(request: NextRequest) {
//   try {
//     console.log('GET TEAMS')
//     const body = await request.json();
//     console.log(body);
//     const { name, email } = body;

//     // Query database
//     const result = await pg
//       .select("id")
//       .from<{ id: string }>("user")
//       .where("email", email);

//     if (!result || result.length === 0) {
//       const res = await pg("user").insert({
//         id: randomUUID(),
//         name: name,
//         email: email,
//         createdAt: pg.fn.now(),
//         updatedAt: pg.fn.now(),
//       });

//       return NextResponse.json(res[0], { status: 201 });
//     }

//     return NextResponse.json({ data: result[0] });
//   } catch (error) {
//     console.error("Errore API profile:", error);
//     return NextResponse.json(
//       { error: "Errore interno del server" },
//       { status: 500 },
//     );
//   }
// }