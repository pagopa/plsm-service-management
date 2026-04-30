import type { NextRequest } from "next/server";
import { GET as handleAuthCallback } from "../route";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
