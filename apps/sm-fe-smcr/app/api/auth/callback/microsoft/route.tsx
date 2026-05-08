// app/api/auth/callback/microsoft/route.tsx
import { NextResponse } from "next/server";
import { getMsalInstance } from "@/lib/msalConfig";
import { clientEnv } from "@/config/env";
import { logServerError } from "@/lib/logger/logger.server.helpers";

export async function GET(request: Request) {
  try {
    await getMsalInstance().initialize();
    await getMsalInstance().handleRedirectPromise();

    return NextResponse.redirect(
      new URL(
        `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
        request.url,
      ),
    );
  } catch (error) {
    logServerError(error, "Errore durante l'autenticazione");
    return NextResponse.redirect(
      new URL(
        `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/error?cause=callback`,
        request.url,
      ),
    );
  }
}

// app/api/auth/callback/microsoft/route.ts
// import { NextResponse } from "next/server";
// import { getMsalInstance } from "@/lib/msalConfig";

// export async function GET(request: Request) {
//   try {
//     await getMsalInstance().initialize();
//     await getMsalInstance().handleRedirectPromise();

//     const origin = new URL(request.url).origin;

//     return NextResponse.redirect(`${origin}/dashboard`);
//   } catch (error) {
//     logServerError(error, "Errore durante l'autenticazione");
//     const origin = new URL(request.url).origin;
//     return NextResponse.redirect(`${origin}/auth/error?cause=callback`);
//   }
// }
