import { LogLevel, PublicClientApplication } from "@azure/msal-browser";
import { clientEnv } from "@/config/env";
import clientLogger from "@/lib/logger/logger.client";

const CLIENT_ID = clientEnv.NEXT_PUBLIC_MSAL_CLIENT_ID;
const TENANT_ID = clientEnv.NEXT_PUBLIC_MSAL_TENANT_ID;
const REDIRECT_URI = clientEnv.NEXT_PUBLIC_MSAL_REDIRECT_URI;
// const BASE_PATH = clientEnv.NEXT_PUBLIC_APP_URL ?? "/";
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
            void clientLogger.error(message);
            return;
          case LogLevel.Info:
            void clientLogger.info(message);
            return;
          case LogLevel.Verbose:
            void clientLogger.debug(message);
            return;
          case LogLevel.Warning:
            void clientLogger.warn(message);
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
    void clientLogger.info(
      {
        info: {
          event: "msal.instance.created",
          metadata: { redirectUri: REDIRECT_URI },
        },
      },
      "MSAL instance created",
    );
    await instance.initialize();
  }

  return instance;
}

// Request di login
export const loginRequest = {
  scopes: ["User.Read"],
  redirectUri: clientEnv.NEXT_PUBLIC_MSAL_REDIRECT_URI,
};
