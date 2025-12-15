import {
  DefaultAzureCredential,
  AzureCliCredential,
  AccessToken,
} from "@azure/identity";

import type { DynamicsList, Contact } from "../types/dynamics.js";
import { getConfigOrThrow } from "../utils/configEnv.js";

// Crea la credential in base all'ambiente
export function createCredential() {
  const cfg = getConfigOrThrow();
  if (cfg.NODE_ENV === "development") {
    console.log("Usando AzureCliCredential (solo sviluppo locale)");
    return new AzureCliCredential();
  } else {
    console.log("Usando DefaultAzureCredential (Managed Identity in produzione)");
    return new DefaultAzureCredential(); // Supporta anche Managed Identity
  }
}

// Ottieni l'access token per Dataverse
export async function getAccessToken(scope: string): Promise<string> {
  const cfg = getConfigOrThrow();
  const credential = createCredential();
  console.log("Richiesta access token...");
  try {
    const tokenResponse: AccessToken | null = await credential.getToken(scope);
    if (!tokenResponse?.token) {
      throw new Error("Token non ricevuto");
    }
    const expiresOn = new Date(tokenResponse.expiresOnTimestamp);
    console.log("Access token ottenuto. Scadenza:", expiresOn.toISOString());
    return tokenResponse.token;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Errore ottenimento token:", msg);
    if (msg.includes("ManagedIdentityCredential") && cfg.NODE_ENV !== "development") {
      throw new Error(
        "Managed Identity non disponibile o non configurata.\n" +
          "Verifica:\n" +
          "1) App Service: Identity → System Assigned = On\n" +
          "2) Application User e ruoli su Dataverse/Dynamics"
      );
    }
    if (msg.includes("AADSTS")) {
      throw new Error(`Errore Azure AD: ${msg}`);
    }
    throw new Error(msg);
  }
}

// Chiama l'API di Dataverse
export async function callDynamicsApi<T = Contact>(
  url: string,
  accessToken: string
): Promise<DynamicsList<T> | Record<string, unknown>> {
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Content-Type": "application/json; charset=utf-8",
        Prefer: "return=representation",
      },
      cache: "no-store",
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error("Errore Dynamics:", text);
      throw new Error(
        `Errore Dynamics API (${resp.status}): ${text}\n` +
          `Controlla ruoli/permessi e l'URL: ${url}`
      );
    }
    const data = (await resp.json()) as unknown;
    return data as DynamicsList<T>;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Errore chiamata API:", msg);
    throw new Error(msg);
  }
}

// Costruisci l'URL per Dataverse
export function buildDynamicsUrl(params: {
  endpoint?: string | null;
  filter?: string | null;
  select?: string | null;
  top?: string | null;
}): { finalUrl: string; scope: string } {
  const cfg = getConfigOrThrow();
  const baseUrl = cfg.DYNAMICS_BASE_URL;
  const scope = cfg.DYNAMICS_SCOPE ?? `${baseUrl}/.default`;
  let dynamicsUrl: string;
  if (params.endpoint) {
    dynamicsUrl = `${baseUrl}${params.endpoint}`;
  } else {
    dynamicsUrl = cfg.DYNAMICS_URL;
  }
  const urlObj = new URL(dynamicsUrl);
  if (params.filter) urlObj.searchParams.set("$filter", params.filter);
  if (params.select) urlObj.searchParams.set("$select", params.select);
  if (params.top) urlObj.searchParams.set("$top", params.top);
  return { finalUrl: urlObj.toString(), scope };
}
