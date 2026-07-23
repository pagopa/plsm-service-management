import { NextResponse } from "next/server";

import { serverEnv } from "@/config/env";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { pdndFetch } from "@/lib/pdnd";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eserviceId = searchParams.get("eserviceId");
  const descriptorId = searchParams.get("descriptorId");

  if (!eserviceId || !descriptorId) {
    return NextResponse.json(
      { error: "Missing required query parameters: eserviceId, descriptorId" },
      { status: 400 },
    );
  }

  if (!uuidPattern.test(eserviceId) || !uuidPattern.test(descriptorId)) {
    return NextResponse.json(
      { error: "Invalid eserviceId or descriptorId format" },
      { status: 400 },
    );
  }

  try {
    const pdndResponse = await pdndFetch(
      `/${serverEnv.PDND_API_VERSION}/eservices/${eserviceId}/descriptors/${descriptorId}`,
    );
    const contentType = pdndResponse.headers.get("content-type") ?? "";

    if (!pdndResponse.ok) {
      const body = await pdndResponse.text();
      return new Response(body, {
        status: pdndResponse.status,
        headers: { "Content-Type": contentType || "application/json" },
      });
    }

    const data = await pdndResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    logServerError(error, "PDND get e-service descriptor error");
    return NextResponse.json(
      { error: "Errore durante il recupero del descriptor e-service" },
      { status: 500 },
    );
  }
}
