import { NextResponse } from "next/server";

import { readLogDetail } from "@/lib/services/logs.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ logId: string }> },
) {
  const { logId } = await params;

  if (!logId) {
    return NextResponse.json({ message: "Missing logId" }, { status: 400 });
  }

  const { data, error } = await readLogDetail(logId);
  if (error) {
    const status = error === "Log not found." ? 404 : 500;
    return NextResponse.json({ message: error }, { status });
  }

  return NextResponse.json(data, { status: 200 });
}
