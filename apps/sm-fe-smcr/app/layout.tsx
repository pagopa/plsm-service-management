import { MSALProvider } from "@/context/MSALproviders";
import { SessionProvider } from "@/context/sessionProvider";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

import { Space_Grotesk } from "next/font/google";

const font = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SMCR",
  description: "Service Management Control Room",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={font.className}>
      <body
        className="min-h-screen bg-background"
        style={
          {
            "--app-footer-clearance":
              "calc(6.5rem + env(safe-area-inset-bottom, 0px))",
          } as React.CSSProperties
        }
      >
        <MSALProvider>
          <SessionProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </SessionProvider>
        </MSALProvider>

        <Toaster />
      </body>
    </html>
  );
}
