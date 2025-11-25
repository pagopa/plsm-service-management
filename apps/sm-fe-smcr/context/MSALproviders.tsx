"use client";
import { MsalProvider } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { getMsalInstance } from "@/lib/msalConfig";

export function MSALProvider({ children }: { children: React.ReactNode }) {
  const [, setInitialized] = useState(false);

  useEffect(() => {
    getMsalInstance()
      .initialize()
      .then(() => setInitialized(true))
      .catch(console.error);
  }, []);

  return <MsalProvider instance={getMsalInstance()}>{children}</MsalProvider>;
}
