// app/api/auth/callback/microsoft/route.tsx
import { NextResponse } from "next/server";
import { getMsalInstance } from "@/lib/msalConfig";

export async function GET(request: Request) {
  try {
    await getMsalInstance().initialize();
    await getMsalInstance().handleRedirectPromise();

    return NextResponse.redirect(
      new URL(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        request.url,
      ),
    );
  } catch (error) {
    console.error("Errore durante l'autenticazione:", error);
    return NextResponse.redirect(
      new URL(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?cause=callback`,
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
//     console.error("Errore durante l'autenticazione:", error);
//     const origin = new URL(request.url).origin;
//     return NextResponse.redirect(`${origin}/auth/error?cause=callback`);
//   }
// }
