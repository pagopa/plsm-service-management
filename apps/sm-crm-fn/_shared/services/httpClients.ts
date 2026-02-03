import type { DynamicsList, DynamicsError } from "../types/dynamics";
import { getAccessToken, buildScope } from "./auth";
import { getConfigOrThrow } from "../utils/config";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const cfg = getConfigOrThrow();
  const scope = buildScope(cfg.DYNAMICS_BASE_URL);
  const accessToken = await getAccessToken(scope);
  const { method = "GET", body, headers = {} } = options;

  const defaultHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    "Content-Type": "application/json; charset=utf-8",
    Prefer: "return=representation",
  };

  const response = await fetch(url, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = `Errore Dynamics API (${response.status}): ${text}`;

    try {
      const errorJson = JSON.parse(text) as DynamicsError;
      if (errorJson.error?.message) {
        errorMessage = `Dynamics Error: ${errorJson.error.message}`;
      }
    } catch {
      // Keep original error message
    }

    console.error("Errore Dynamics:", text);
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function get<T>(url: string): Promise<DynamicsList<T>> {
  return request<DynamicsList<T>>(url);
}

export async function post<T, R>(url: string, data: T): Promise<R> {
  return request<R>(url, { method: "POST", body: data });
}

export async function patch<T, R>(url: string, data: T): Promise<R> {
  return request<R>(url, { method: "PATCH", body: data });
}

export async function del(url: string): Promise<void> {
  await request<void>(url, { method: "DELETE" });
}

export function buildUrl(params: {
  endpoint?: string | null;
  filter?: string | null;
  select?: string | null;
  top?: string | null;
  expand?: string | null;
}): string {
  const cfg = getConfigOrThrow();
  const baseUrl = cfg.DYNAMICS_BASE_URL;

  let dynamicsUrl: string;
  if (params.endpoint) {
    dynamicsUrl = `${baseUrl}${params.endpoint}`;
  } else {
    dynamicsUrl = cfg.DYNAMICS_URL_CONTACTS;
  }

  const urlObj = new URL(dynamicsUrl);
  if (params.filter) urlObj.searchParams.set("$filter", params.filter);
  if (params.select) urlObj.searchParams.set("$select", params.select);
  if (params.top) urlObj.searchParams.set("$top", params.top);
  if (params.expand) urlObj.searchParams.set("$expand", params.expand);

  return urlObj.toString();
}
