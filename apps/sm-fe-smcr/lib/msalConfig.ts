import { LogLevel, PublicClientApplication } from "@azure/msal-browser";

const CLIENT_ID = process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || "";
const TENANT_ID = process.env.NEXT_PUBLIC_MSAL_TENANT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI;
// const BASE_PATH = process.env.NEXT_PUBLIC_APP_URL ?? "/";
// console.log("🔍 MSAL Config Debug:");
// console.log("- CLIENT_ID:", CLIENT_ID ? "✅ Set" : "❌ Missing");
// console.log("- TENANT_ID:", TENANT_ID ? "✅ Set" : "❌ Missing");
// console.log("- REDIRECT_URI:", REDIRECT_URI ? "✅ Set" : "❌ Missing");
// console.log("- BASE_PATH:", BASE_PATH ? "✅ Set" : "❌ Missing");
// console.log("- Full REDIRECT_URI:", REDIRECT_URI);
export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: REDIRECT_URI,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
  tokenRenewalOffsetSeconds: 300, // Rinnova il token 5 minuti prima della scadenza
};

let _msalInstance: PublicClientApplication;

export function getMsalInstance(): PublicClientApplication {
  if (!_msalInstance) {
    _msalInstance = new PublicClientApplication(msalConfig);
  }
  return _msalInstance;
}
// Funzione di inizializzazione garantita
export async function ensureInitialized() {
  const instance = getMsalInstance();
  if (!instance.getActiveAccount()) {
    console.log("🧠 MSAL INSTANCE CREATED");
    console.log("With config:", msalConfig);
    await instance.initialize();
  }

  return instance;
}

// Request di login
export const loginRequest = {
  scopes: ["User.Read"],
  redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI,
};
