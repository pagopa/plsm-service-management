"use client";
import { MsalProvider } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { getMsalInstance } from "@/lib/msalConfig";
import clientLogger from "@/lib/logger/logger.client";

export function MSALProvider({ children }: { children: React.ReactNode }) {
  const [, setInitialized] = useState(false);

  useEffect(() => {
    getMsalInstance()
      .initialize()
      .then(() => setInitialized(true))
      .catch((error) => {
        void clientLogger.error({ error }, "MSAL initialize failed");
      });
  }, []);

  return <MsalProvider instance={getMsalInstance()}>{children}</MsalProvider>;
}
