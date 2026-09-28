"use server";

import { serverEnv } from "@/config/env";
import logger from "@/lib/logger/logger.server";

import {
  buildCallsSearchParams,
  listCallsQuerySchema,
  listCallsResponseSchema,
  type CallFieldError,
  type ListCallsInput,
  type ListCallsResult,
} from "./calls.schema";

function validationFields(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): CallFieldError[] {
  return error.issues.map((issue) => ({
    field: String(issue.path[0] ?? "form"),
    message: issue.message,
  }));
}

function readValidationFields(payload: unknown): CallFieldError[] {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return [];
  }

  const error = payload.error;
  if (!error || typeof error !== "object" || !("fields" in error)) {
    return [];
  }

  if (!Array.isArray(error.fields)) {
    return [];
  }

  return error.fields.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    if (!("field" in item) || !("message" in item)) {
      return [];
    }
    if (typeof item.field !== "string" || typeof item.message !== "string") {
      return [];
    }
    return [{ field: item.field, message: item.message }];
  });
}

function readMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return undefined;
  }
  return typeof payload.message === "string" ? payload.message : undefined;
}

export async function listCalls(
  input: ListCallsInput = {},
): Promise<ListCallsResult> {
  const parsed = listCallsQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Errore di validazione",
      fields: validationFields(parsed.error),
    };
  }

  const baseUrl = serverEnv.FE_SMCR_CRM_API_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    logger.warn(
      {
        info: {
          event: "monitoring.calls.missing-env",
          actor: "smcr-ui",
          subject: "listCalls",
          metadata: {},
        },
      },
      "FE_SMCR_CRM_API_URL not set",
    );
    return { success: false, message: "API CRM non configurata." };
  }

  const params = buildCallsSearchParams(parsed.data);
  const query = params.toString();
  const url = query ? `${baseUrl}/calls?${query}` : `${baseUrl}/calls`;
  const headers: Record<string, string> = {};
  if (serverEnv.FE_SMCR_CRM_API_KEY) {
    headers["x-functions-key"] = serverEnv.FE_SMCR_CRM_API_KEY;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const responseText = await response.text().catch(() => "");
    let payload: unknown = null;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      payload = null;
    }

    if (response.status === 400) {
      const fields = readValidationFields(payload);
      return {
        success: false,
        message: readMessage(payload) ?? "Errore di validazione",
        ...(fields.length > 0 ? { fields } : {}),
      };
    }

    if (!response.ok) {
      logger.error(
        {
          request: { method: "GET", path: url, statusCode: response.status },
          info: {
            event: "monitoring.calls.list.failed",
            actor: "smcr-ui",
            subject: "listCalls",
            metadata: {
              productId: parsed.data.productId,
              hasInstitutionId: Boolean(parsed.data.institutionId),
            },
          },
        },
        "listCalls failed",
      );

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: "Accesso all'API CRM non autorizzato.",
        };
      }
      return {
        success: false,
        message: "Errore durante il recupero delle call",
      };
    }

    const body = listCallsResponseSchema.safeParse(payload);
    if (!body.success) {
      logger.error(
        {
          request: { method: "GET", path: url, statusCode: response.status },
          info: {
            event: "monitoring.calls.list.invalid-payload",
            actor: "smcr-ui",
            subject: "listCalls",
            metadata: {},
          },
        },
        "listCalls received an unexpected payload",
      );
      return {
        success: false,
        message: "Errore durante il recupero delle call",
      };
    }

    return {
      success: true,
      data: body.data.data,
      count: body.data.count,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      {
        error: { name: err.name, message: err.message },
        info: {
          event: "monitoring.calls.list.error",
          actor: "smcr-ui",
          subject: "listCalls",
          metadata: {},
        },
      },
      "listCalls error",
    );
    return {
      success: false,
      message: "Errore durante il recupero delle call",
    };
  }
}
