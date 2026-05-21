"use client";
import Image from "next/image";
import loginBg from "public/login_bg.png";
import logoPagoPa from "public/logo_4.svg";
import { LoginForm } from "../auth/login";
import { Switch } from "../ui/switch";
import { useEffect, useState } from "react";
import { clientEnv } from "@/config/env";
import clientLogger from "@/lib/logger/logger.client";

export const LoginPage = () => {
  const redirectURL = clientEnv.NEXT_PUBLIC_APP_URL;

  const [isVisible, setIsVisible] = useState(false);

  const [dbStatus, setDbStatus] = useState<"checking" | "online" | "error">(
    "checking",
  );

  useEffect(() => {
    async function checkDb() {
      try {
        const res = await fetch("/api/db-status");
        const json = await res.json();
        setDbStatus(json.status === "online" ? "online" : "error");
      } catch (err) {
        setDbStatus("error");
        void clientLogger.error({ error: err }, "DB status check failed");
      }
    }

    checkDb();
  }, []);

  return (
    <main className="min-w-screen flex-1 flex flex-row">
      <div className="w-full sm:w-[50%] p-10 self-stretch flex flex-col">
        <div className="flex flex-1 flex-col">
          <div className="flex flex-row items-center text-lg gap-2">
            <Image
              src={logoPagoPa.src}
              width={120}
              height={120}
              alt="logo pagopa"
            />
            <p>Service Management Control Room</p>
          </div>

          <div className="w-full flex-1 flex flex-row justify-center">
            <div className="flex flex-col items-center mt-52 text-center gap-5">
              <div>
                <p className="text-2xl">Welcome back</p>
                <p className="text-xs">MSAL Authentication</p>
              </div>
              <LoginForm />
            </div>
          </div>

          <div className="w-full relative flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <p>Team PLSM</p>
              {isVisible && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex flex-row gap-1">
                    <p>DB Status:</p>
                    <p
                      className={
                        dbStatus === "online"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      Online
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p>🔁 MSAL Redirect URI:</p>
                    <code>{redirectURL}</code>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-row items-center absolute left-0 bottom-0">
              <Switch
                checked={isVisible}
                onCheckedChange={(checked) => setIsVisible(checked)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="hidden sm:block w-[50%] relative self-stretch">
        <Image
          src={loginBg.src}
          alt="login image"
          fill
          className="object-cover"
        />
      </div>
    </main>
  );
};
