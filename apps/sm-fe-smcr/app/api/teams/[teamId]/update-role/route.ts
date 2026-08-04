import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "I ruoli legacy non sono più supportati; l'accesso verrà gestito tramite permessi assegnati al team.",
      success: false,
    },
    { status: 410 },
  );
}
