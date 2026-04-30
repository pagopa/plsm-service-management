import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    claims: session,
  });
}
