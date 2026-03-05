"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { clientEnv } from "@/config/env";

type DBStatus = "loading" | "online" | "offline";

export const StatusCard = () => {
  const [dbHost, setDbHost] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<DBStatus>("loading");

  useEffect(() => {
    fetch("/api/db-status")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Errore sconosciuto");
        }
        setDbHost(data.host);
        setStatus("online");
      })
      .catch((err) => {
        setStatus("offline");
        setDbHost("Errore di connessione");
        setErrorMsg(err.message);
      });
  }, []);

  const renderStatus = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
            <span>Controllo connessione...</span>
          </div>
        );
      case "online":
        return (
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>DB Online</span>
          </div>
        );
      case "offline":
        return (
          <div className="flex items-center gap-2 text-red-600 font-semibold">
            <XCircle className="w-4 h-4" />
            <span>DB Offline</span>
          </div>
        );
    }
  };

  return (
    <Card className="mt-6 bg-muted text-muted-foreground shadow-md max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-base">🛠️ Sistema: Info debug</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-xs font-mono">
        {renderStatus()}

        <div>
          <span className="font-semibold">🛢️ DB Host:</span>
          <br />
          <code>{dbHost ?? "..."}</code>
        </div>
        {status === "offline" && errorMsg && (
          <div className="text-xs text-red-500 bg-red-50 rounded p-2 border border-red-300">
            <strong>Errore:</strong> {errorMsg}
          </div>
        )}
        <div>
          <span className="font-semibold">🔁 Redirect URI:</span>
          <br />
          <code>
            {clientEnv.NEXT_PUBLIC_MSAL_REDIRECT_URI ?? "Non definito"}
          </code>
        </div>
        <div>
          <span className="font-semibold">🆔 Client ID:</span>
          <br />
          <code>
            {clientEnv.NEXT_PUBLIC_MSAL_CLIENT_ID ?? "Non definito"}
          </code>
        </div>
        <div>
          <span className="font-semibold">🏢 Tenant ID:</span>
          <br />
          <code>
            {clientEnv.NEXT_PUBLIC_MSAL_TENANT_ID ?? "Non definito"}
          </code>
        </div>
        <div>
          <span className="font-semibold">🏢 Public App URL:</span>
          <br />
          <code>{clientEnv.NEXT_PUBLIC_APP_URL ?? "Non definito"}</code>
        </div>
      </CardContent>
    </Card>
  );
};
