import { NextResponse } from "next/server";

import { logServerError } from "@/lib/logger/logger.server.helpers";
import { pdndFetch } from "@/lib/pdnd";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeFilename(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  const filename = normalized || "eservice-interface";
  return /\.(ya?ml)$/i.test(filename) ? filename : `${filename}.yaml`;
}

function attachmentHeaders({
  contentLength,
  contentType,
  filename,
}: {
  contentLength: number;
  contentType: string;
  filename: string;
}): Headers {
  const asciiName = sanitizeFilename(filename);
  const utf8Name = encodeURIComponent(asciiName);
  const headers = new Headers();

  headers.set("Content-Type", contentType);
  headers.set("Content-Length", contentLength.toString());
  headers.set(
    "Content-Disposition",
    `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
  );

  return headers;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eserviceId = searchParams.get("eserviceId");
  const descriptorId = searchParams.get("descriptorId");
  const filename = searchParams.get("filename") ?? "eservice-interface.yaml";

  if (!eserviceId || !descriptorId) {
    return NextResponse.json(
      { error: "Missing required query parameters" },
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
      `/v2/eservices/${eserviceId}/descriptors/${descriptorId}/interface`,
    );
    const responseContentType = pdndResponse.headers.get("content-type") ?? "";

    if (!pdndResponse.ok) {
      const body = await pdndResponse.text();
      return new Response(body, {
        status: pdndResponse.status,
        headers: {
          "Content-Type": responseContentType || "application/json",
        },
      });
    }

    if (!responseContentType.toLowerCase().includes("multipart/form-data")) {
      const buffer = await pdndResponse.arrayBuffer();
      return new Response(
        buffer,
        {
          status: 200,
          headers: attachmentHeaders({
            contentLength: buffer.byteLength,
            contentType: responseContentType || "application/octet-stream",
            filename,
          }),
        },
      );
    }

    const formData = await pdndResponse.formData();
    const file = formData.get("file");
    const pdndFilename = formData.get("filename");
    const pdndContentType = formData.get("contentType");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "PDND interface response does not contain a file" },
        { status: 502 },
      );
    }

    const buffer = await file.arrayBuffer();
    const downloadFilename =
      filename ||
      (typeof pdndFilename === "string" ? pdndFilename : "eservice-interface");
    const contentType =
      typeof pdndContentType === "string" && pdndContentType.trim()
        ? pdndContentType
        : file.type || "application/octet-stream";

    return new Response(buffer, {
      status: 200,
      headers: attachmentHeaders({
        contentLength: buffer.byteLength,
        contentType,
        filename: downloadFilename,
      }),
    });
  } catch (error) {
    logServerError(error, "PDND e-service interface download error");
    return NextResponse.json(
      { error: "Errore durante il download dell'interfaccia e-service" },
      { status: 500 },
    );
  }
}
