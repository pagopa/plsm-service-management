"use client";
import Image from "next/image";
import loginBg from "public/login_bg.png";
import logoPagoPa from "public/logo_4.svg";
import { LoginForm } from "../auth/login";
import { Switch } from "../ui/switch";
import { useEffect, useState } from "react";

export const LoginPage = () => {
  const redirectURL = process.env.NEXT_PUBLIC_APP_URL;

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
        console.error(err);
      }
    }

    checkDb();
  }, []);

  return (
    <main className="min-w-screen h-full flex flex-row sm:items-center sm:justify-center">
      <div className="w-full sm:w-[50%] h-full p-10">
        <div className="flex flex-col h-full">
          <div className="flex flex-row items-center text-lg gap-2">
            <Image
              src={logoPagoPa.src}
              width={120}
              height={120}
              alt="logo pagopa"
            />
            <p>Service Management Control Room</p>
          </div>

          <div className="w-full h-full flex flex-row justify-center">
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
      <div className="hidden sm:block w-[50%] h-full relative">
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
