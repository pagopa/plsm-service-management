import { randomUUID } from "node:crypto";
import { z } from "zod";
import { serverEnv } from "@/config/env";
import logger from "@/lib/logger/logger.server";

const VALIDATION_EVENT = "Microsoft.EventGrid.SubscriptionValidationEvent";

const eventSchema = z
  .object({
    eventType: z.string().optional(),
    data: z.unknown().optional(),
  })
  .passthrough();

const payloadSchema = z.union([z.array(eventSchema).min(1), eventSchema]);

const validationDataSchema = z.object({
  validationCode: z.string().min(1),
});

function isAuthenticated(
  request: Request,
  requestLogger: typeof logger,
): boolean {
  const expectedKey = serverEnv.FE_SMCR_API_KEY_SERVICES;

  if (!expectedKey) {
    requestLogger.error(
      { info: { event: "azure.webhook.authentication.not-configured" } },
      "Azure webhook API key is not configured",
    );
    return false;
  }

  const receivedKey =
    request.headers.get("x-api-key") ??
    new URL(request.url).searchParams.get("api_key");

  if (!receivedKey || receivedKey !== expectedKey) {
    requestLogger.warn(
      {
        info: {
          event: "azure.webhook.authentication.failed",
          metadata: {
            reason: receivedKey ? "invalid-api-key" : "missing-api-key",
          },
        },
      },
      receivedKey
        ? "Azure webhook API key is invalid"
        : "Azure webhook API key is missing",
    );
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const requestLogger = logger.child(
    {
      requestId: randomUUID(),
      request: { method: request.method, path: "/api/webhooks/azure" },
    },
    { formatters: { log: (object) => object } },
  );

  if (!isAuthenticated(request, requestLogger)) {
    const configured = Boolean(serverEnv.FE_SMCR_API_KEY_SERVICES);
    return Response.json(
      { error: configured ? "Unauthorized" : "Webhook non configurato" },
      { status: configured ? 401 : 503 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    requestLogger.warn(
      { info: { event: "azure.webhook.payload.invalid-json" } },
      "Azure webhook request body is not valid JSON",
    );
    return Response.json({ error: "JSON non valido" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(payload);

  if (!parsed.success) {
    requestLogger.warn(
      { info: { event: "azure.webhook.payload.invalid-structure" } },
      "Azure webhook payload structure is invalid",
    );
    return Response.json({ error: "Payload non valido" }, { status: 400 });
  }

  const events = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  requestLogger.info(
    {
      info: { event: "azure.webhook.payload.received", metadata: { payload } },
    },
    "Azure webhook payload received",
  );

  for (const [index, event] of events.entries()) {
    requestLogger.info(
      {
        info: {
          event: "azure.webhook.event.received",
          metadata: {
            index: index + 1,
            eventType: event.eventType,
            data: event.data ?? null,
          },
        },
      },
      `Azure webhook event ${index + 1} data received`,
    );
  }

  const validationEvent = events.find(
    (event) => event.eventType === VALIDATION_EVENT,
  );

  if (validationEvent) {
    const validation = validationDataSchema.safeParse(validationEvent.data);

    if (!validation.success) {
      requestLogger.warn(
        { info: { event: "azure.webhook.validation.invalid-code" } },
        "Azure webhook validation code is missing or invalid",
      );
      return Response.json(
        { error: "validationCode assente o non valido" },
        { status: 400 },
      );
    }

    return Response.json({
      validationResponse: validation.data.validationCode,
    });
  }

  return Response.json({ received: true });
}

function methodNotAllowed() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export const HEAD = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
