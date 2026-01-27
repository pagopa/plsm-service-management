import {
  DefaultAzureCredential,
  DeviceCodeCredential,
  type TokenCredential,
  type AccessToken,
} from "@azure/identity";
import { isDevelopment, getConfigOrThrow } from "../utils/config";

let credential: TokenCredential | null = null;

const DEV_TENANT_ID = process.env.AZURE_TENANT_ID || "";
const DEV_CLIENT_ID = process.env.AZURE_CLIENT_ID || "";

function getCredential(): TokenCredential {
  if (credential) {
    return credential;
  }

  if (isDevelopment() && DEV_TENANT_ID && DEV_CLIENT_ID) {
    console.log(
      "Ambiente di sviluppo: usando DeviceCodeCredential per autenticazione interattiva",
    );
    credential = new DeviceCodeCredential({
      tenantId: DEV_TENANT_ID,
      clientId: DEV_CLIENT_ID,
      userPromptCallback: (info) => {
        console.log("\n=== AUTENTICAZIONE RICHIESTA ===");
        console.log(info.message);
        console.log("================================\n");
      },
    });
  } else if (isDevelopment()) {
    console.log(
      "Ambiente di sviluppo senza credenziali configurate: usando DefaultAzureCredential",
    );
    credential = new DefaultAzureCredential();
  } else {
    console.log(
      "Ambiente di produzione: usando DefaultAzureCredential (Managed Identity)",
    );
    credential = new DefaultAzureCredential();
  }

  return credential;
}

export async function getAccessToken(scope: string): Promise<string> {
  const cred = getCredential();
  console.log(`Richiesta access token per scope: ${scope}`);

  try {
    const tokenResponse: AccessToken | null = await cred.getToken(scope);
    if (!tokenResponse?.token) {
      throw new Error("Token non ricevuto");
    }

    const expiresOn = new Date(tokenResponse.expiresOnTimestamp);
    console.log(`Access token ottenuto. Scadenza: ${expiresOn.toISOString()}`);

    return tokenResponse.token;
  } catch (e: unknown) {
    const cfg = getConfigOrThrow();
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Errore ottenimento token:", msg);

    if (
      msg.includes("ManagedIdentityCredential") &&
      cfg.NODE_ENV !== "development"
    ) {
      throw new Error(
        "Managed Identity non disponibile o non configurata.\n" +
          "Verifica:\n" +
          "1) Function App: Identity -> System Assigned = On\n" +
          "2) Application User e ruoli su Dataverse/Dynamics",
      );
    }
    if (msg.includes("AADSTS")) {
      throw new Error(`Errore Azure AD: ${msg}`);
    }
    throw new Error(msg);
  }
}

export function buildScope(baseUrl: string): string {
  const cfg = getConfigOrThrow();
  return cfg.DYNAMICS_SCOPE ?? `${baseUrl}/.default`;
}

export function resetCredential(): void {
  credential = null;
}
