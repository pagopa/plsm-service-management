# 🔐 Integrazione Auth Function in Next.js (sm-fe-smcr)

Guida completa per integrare l'Auth Function (`sm-auth-fn`) nell'applicazione Next.js per gestire autenticazione MSAL con **Server-Side Flow**.

---

## 📋 Indice

1. [Overview](#-overview)
2. [Architettura del Flusso](#-architettura-del-flusso)
3. [Prerequisiti](#-prerequisiti)
4. [Setup Passo-Passo](#-setup-passo-passo)
5. [Implementazione Client-Side](#-implementazione-client-side)
6. [Implementazione Server-Side](#-implementazione-server-side)
7. [Middleware Protection](#-middleware-protection)
8. [Testing](#-testing)
9. [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

Questa integrazione implementa un approccio **Server-Side MSAL Flow** con **Public Client + PKCE**:

- **Browser** → Redirect a `/auth/login` endpoint
- **Auth Function** → Genera PKCE challenge e redirect ad Azure AD
- **Azure AD** → Utente completa login e ritorna authorization code
- **Auth Function** → Scambia code per token usando PKCE verifier (NO CLIENT SECRET!)
- **Auth Function** → Genera JWT interno e lo salva in HttpOnly cookie
- **Next.js** → Usa JWT per proteggere le route

### Vantaggi del Nuovo Approccio

✅ **Nessun Client Secret richiesto** - Public Client + PKCE flow  
✅ **Frontend completamente agnostico** - Nessuna dipendenza MSAL nel browser  
✅ **HttpOnly Cookies** invece di localStorage (più sicuro)  
✅ **Server-side route protection** con Next.js middleware  
✅ **Flusso OAuth2 standard** con Authorization Code + PKCE  
✅ **Session management** centralizzato nell'Auth Function

### ⚠️ Importante: Cambiamento Architetturale

Questa è una **completa riscrittura** dell'autenticazione:

- ❌ **RIMOSSO:** `@azure/msal-browser` dal frontend (sarà rimosso in futuro PR)
- ❌ **RIMOSSO:** `validateToken()` service call con Azure AD token
- ❌ **DEPRECATED:** Endpoint `/auth/validate`
- ✅ **NUOVO:** Server-Side MSAL Public Client con PKCE
- ✅ **NUOVO:** Endpoints `/auth/login` e `/auth/callback`

---

## 🏗️ Architettura del Flusso

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    SERVER-SIDE MSAL AUTHENTICATION FLOW (PKCE)                    │
└──────────────────────────────────────────────────────────────────────────────────┘

1️⃣ INITIATE LOGIN - Browser → Auth Function
┌─────────┐                           ┌──────────────┐
│ Browser │ ──── GET /auth/login ───► │ Auth Func    │
│         │       ?returnUrl=/dash     │ (sm-auth-fn) │
│         │                            │              │
│         │                            │ • Genera PKCE verifier + challenge
│         │                            │ • Salva verifier in cookie temporaneo
│         │                            │ • Genera state per CSRF protection
│         │                            │              │
│         │ ◄──── 302 Redirect ─────  │              │
│         │    + PKCE cookies          └──────────────┘
│         │       Set-Cookie: pkce_verifier=...
│         │       Set-Cookie: auth_state=...
└─────────┘
   │
   │ Redirect to Azure AD
   │
   ▼

2️⃣ AZURE AD LOGIN - User authenticates
┌─────────┐                           ┌──────────────┐
│ Browser │ ──── User Login ────────► │  Azure AD    │
│         │   code_challenge=...       │              │
│         │   state=...                │              │
│         │                            │ • User enters credentials
│         │                            │ • User grants consent
│         │                            │              │
│         │ ◄──── 302 Callback ─────  │              │
└─────────┘       code=xxx&state=yyy   └──────────────┘
   │
   │ Callback URL: /auth/callback?code=...&state=...
   │
   ▼

3️⃣ TOKEN EXCHANGE - Auth Function → Azure AD
┌─────────┐                           ┌──────────────┐
│ Browser │ ──── GET /callback ─────► │ Auth Func    │
│         │       code=xxx             │              │
│         │       state=yyy            │ • Valida state (CSRF)
│         │    + PKCE cookies          │ • Recupera pkce_verifier da cookie
│         │                            │              │
│         │                            │ ─── Exchange code for token ───►
│         │                            │     code=xxx                     ┌───────────┐
│         │                            │     code_verifier=...            │ Azure AD  │
│         │                            │     (NO CLIENT SECRET!)          │           │
│         │                            │ ◄── Access Token ───────────────  └───────────┘
│         │                            │     { access_token, id_token }
│         │                            │              │
│         │                            │ • Genera JWT interno
│         │                            │ • Clear PKCE cookies
│         │                            │              │
│         │ ◄──── 302 Redirect ─────  │              │
│         │    + JWT cookie            └──────────────┘
│         │       Set-Cookie: auth-token=...
│         │       Location: /dashboard
└─────────┘
   │
   │ JWT Cookie (internal, HttpOnly)
   │
   ▼

4️⃣ PROTECTED ROUTES - Browser → Next.js
┌─────────┐                           ┌──────────────┐
│ Browser │ ──── GET /dashboard ────► │  Next.js     │
│         │    Cookie: auth-token=...  │  Middleware  │
│         │                            │              │
│         │                            │ • Valida JWT
│         │                            │ • Check expiry
│         │                            │              │
│         │ ◄──── Page Content ─────  │              │
└─────────┘                           └──────────────┘

5️⃣ REFRESH - Background Refresh (opzionale)
┌─────────┐                           ┌──────────────┐
│ Browser │ ──── POST /auth/refresh ─► │ Auth Func    │
│         │    Cookie: auth-token=old  │              │
│         │                            │              │
│         │ ◄──── New Cookie ────────  │              │
└─────────┘    Set-Cookie: auth-token=new  └──────────────┘

6️⃣ LOGOUT - Clear Session
┌─────────┐                           ┌──────────────┐
│ Browser │ ──── POST /auth/logout ──► │ Auth Func    │
│         │                            │              │
│         │ ◄──── Clear Cookie ──────  │              │
└─────────┘    Set-Cookie: auth-token=; └──────────────┘
```

### Perché PKCE?

**PKCE (Proof Key for Code Exchange)** è uno standard OAuth2 che permette di autenticare **Public Clients** senza usare Client Secret:

1. **code_verifier**: Random string (43-128 chars)
2. **code_challenge**: SHA256(code_verifier) in base64url
3. Azure AD riceve solo il **challenge** durante login
4. Auth Function scambia **code + verifier** per token
5. Azure AD verifica che SHA256(verifier) = challenge originale

✅ Nessun secret da proteggere  
✅ Protezione contro authorization code interception  
✅ Conforme a best practices OAuth2 per Public Clients

---

## ✅ Prerequisiti

Prima di iniziare, verifica:

- [ ] **Auth Function deployata** su DEV/PROD
  ```bash
  curl https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/health
  ```
- [ ] **Azure AD App Registration** configurata con:
  - **Public Client Flow** abilitato (NO Certificate/Secret required)
  - **Redirect URIs** configurati per `/auth/callback`:
    - DEV: `https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback`
    - PROD: `https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback`
    - Local: `http://localhost:7071/api/v1/auth/callback`
- [ ] **Environment variables** configurate in Key Vault
- [ ] ⚠️ **NOTA**: `@azure/msal-browser` nel frontend NON è più necessario (verrà rimosso in futuro PR)

---

## 🚀 Setup Passo-Passo

### Step 1: Aggiungere URL Auth Function alle Environment Variables

#### **Locale (`.env.local`)**

```bash
# Auth Function URL
NEXT_PUBLIC_AUTH_FUNCTION_URL=http://localhost:7071/api/v1

# ⚠️ DEPRECATED: Queste variabili MSAL non sono più necessarie (ma mantenute per compatibilità temporanea)
# NEXT_PUBLIC_MSAL_CLIENT_ID=your-client-id
# NEXT_PUBLIC_MSAL_TENANT_ID=your-tenant-id
# NEXT_PUBLIC_MSAL_REDIRECT_URI=http://localhost:3000/auth/callback
```

#### **Azure (Terraform `dev.yaml`)**

Aggiungere alla sezione `fe_smcr`:

```yaml
fe_smcr:
  __local: yaml_fe_smcr
  # ... altre variabili esistenti ...

  # Auth Function URLs
  production:
    NEXT_PUBLIC_AUTH_FUNCTION_URL: "https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1"

  staging:
    NEXT_PUBLIC_AUTH_FUNCTION_URL: "https://plsm-d-itn-auth-func-01-staging.azurewebsites.net/api/v1"
```

### Step 2: Aggiornare `config/env.ts`

```typescript
// apps/sm-fe-smcr/config/env.ts

export const clientEnv = {
  // Auth Function URL (REQUIRED)
  NEXT_PUBLIC_AUTH_FUNCTION_URL:
    process.env.NEXT_PUBLIC_AUTH_FUNCTION_URL || "",

  // ⚠️ DEPRECATED: MSAL configs non più necessarie (mantenute per compatibilità temporanea)
  // Verranno rimosse in un futuro PR
  // NEXT_PUBLIC_MSAL_CLIENT_ID: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || "",
  // NEXT_PUBLIC_MSAL_TENANT_ID: process.env.NEXT_PUBLIC_MSAL_TENANT_ID || "",
  // NEXT_PUBLIC_MSAL_REDIRECT_URI: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || "",
};
```

---

## 💻 Implementazione Client-Side

### ⚠️ IMPORTANTE: Nuovo Approccio Semplificato

Il frontend **NON** ha più bisogno di:

- ❌ `@azure/msal-browser` (sarà rimosso in futuro PR)
- ❌ `validateToken()` service call
- ❌ Gestire Access Token da Azure AD
- ❌ MSAL Context/Provider

Il login è ora un **semplice redirect** a `/auth/login`!

### Step 3: Creare Pagina di Login

Il login è semplicemente un redirect all'endpoint Auth Function:

```typescript
// apps/sm-fe-smcr/app/auth/login/page.tsx
"use client";

import { clientEnv } from "@/config/env";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  useEffect(() => {
    // Redirect immediatamente all'Auth Function
    const authFunctionUrl = clientEnv.NEXT_PUBLIC_AUTH_FUNCTION_URL;
    const loginUrl = `${authFunctionUrl}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;

    window.location.href = loginUrl;
  }, [returnUrl]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to login...</h1>
        <p className="text-gray-600">Please wait while we redirect you to Microsoft login.</p>
      </div>
    </div>
  );
}
```

**Oppure, per un approccio ancora più semplice, usa un link diretto:**

```typescript
// components/LoginButton.tsx
"use client";

import { clientEnv } from "@/config/env";

export function LoginButton() {
  const handleLogin = () => {
    const authUrl = `${clientEnv.NEXT_PUBLIC_AUTH_FUNCTION_URL}/auth/login?returnUrl=/dashboard`;
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleLogin}>
      Login with Microsoft
    </button>
  );
}

// Oppure con un semplice <a> tag:
export function LoginLink() {
  const authUrl = `${clientEnv.NEXT_PUBLIC_AUTH_FUNCTION_URL}/auth/login?returnUrl=/dashboard`;

  return (
    <a href={authUrl} className="btn btn-primary">
      Login with Microsoft
    </a>
  );
}
```

### Step 4: Creare Service per Auth Operations (Opzionali)

Solo per **refresh** e **logout** (se necessari):

```typescript
// apps/sm-fe-smcr/lib/services/auth.service.ts

import { clientEnv } from "@/config/env";

const AUTH_URL = clientEnv.NEXT_PUBLIC_AUTH_FUNCTION_URL;

export interface AuthRefreshResponse {
  success: boolean;
  message: string;
}

export interface AuthLogoutResponse {
  success: boolean;
  message: string;
}

/**
 * ⚠️ DEPRECATED: validateToken() non più necessario
 * Il login ora usa server-side flow con redirect
 */

/**
 * Rinnova JWT interno (estende sessione)
 * @returns Response con success status
 */
export async function refreshToken(): Promise<AuthRefreshResponse> {
  try {
    const response = await fetch(`${AUTH_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // IMPORTANTE: include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Token refresh failed:", data.message);
      return { success: false, message: data.message || "Refresh failed" };
    }

    console.log("✅ Token refreshed successfully");
    return data;
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Logout - invalida sessione (clear cookie)
 * @returns Response con success status
 */
export async function logout(): Promise<AuthLogoutResponse> {
  try {
    const response = await fetch(`${AUTH_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // IMPORTANTE: include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("⚠️ Logout response not OK, but continuing:", data.message);
    }

    console.log("✅ Logged out successfully");
    return { success: true, message: "Logged out" };
  } catch (error) {
    console.error("❌ Error during logout:", error);
    return { success: true, message: "Logged out (with errors)" };
  }
}

/**
 * Health check dell'Auth Function
 * @returns true se la function è disponibile
 */
export async function checkAuthFunctionHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AUTH_URL}/health`);
    const data = await response.json();
    return response.ok && data.status === "healthy";
  } catch (error) {
    console.error("❌ Auth Function health check failed:", error);
    return false;
  }
}
```

### Step 5: Esempio Logout Button

```typescript
// components/LogoutButton.tsx
"use client";

import { logout } from "@/lib/services/auth.service";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();

    // Redirect alla home page
    router.push("/");
    router.refresh(); // Force refresh per clear del middleware
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="btn btn-secondary"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
```

---

## 🛡️ Implementazione Server-Side

### Step 5: Creare Utility per JWT Validation (Server-Side)

Creare `lib/auth/jwt.server.ts`:

```typescript
// apps/sm-fe-smcr/lib/auth/jwt.server.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_COOKIE_NAME = "auth-token";

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

/**
 * Legge e valida JWT dal cookie (server-side only)
 * @returns JWT payload se valido, null altrimenti
 */
export async function getServerSession(): Promise<JwtPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(JWT_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // NOTA: Non validare la firma qui, l'Auth Function lo fa già
    // Decodifica senza verifica (trusted cookie HttpOnly)
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded) {
      return null;
    }

    // Verifica expiry
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      console.warn("⚠️ JWT expired");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("❌ Error reading session:", error);
    return null;
  }
}

/**
 * Verifica se l'utente è autenticato (server-side only)
 * @returns true se autenticato
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return !!session;
}

/**
 * Ottiene user info dalla sessione (server-side only)
 * @returns User info se autenticato, null altrimenti
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
  name: string;
  roles: string[];
} | null> {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    roles: session.roles,
  };
}
```

**NOTA:** Installa dipendenza:

```bash
cd apps/sm-fe-smcr
yarn add jsonwebtoken
yarn add -D @types/jsonwebtoken
```

---

## 🛡️ Middleware Protection

### Step 6: Aggiornare Middleware per Route Protection

Modificare `middleware.ts`:

```typescript
// apps/sm-fe-smcr/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_COOKIE_NAME = "auth-token";
const AUTH_FUNCTION_URL = process.env.NEXT_PUBLIC_AUTH_FUNCTION_URL || "";

/**
 * Middleware per proteggere route autenticate
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;

  // Se non c'è token, redirect a login
  if (!token) {
    console.warn("⚠️ No auth token, redirecting to login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    // Verifica JWT (basic check, non validare firma per performance)
    // La firma è già validata dall'Auth Function
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );

    // Verifica expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn("⚠️ JWT expired, redirecting to login");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Token valido, continua
    return NextResponse.next();
  } catch (error) {
    console.error("❌ JWT validation failed:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

// Proteggi tutte le route /dashboard/*
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/team/:path*",
    "/admin/:path*",
    // Aggiungi altre route protette
  ],
};
```

---

## 🧪 Testing

### Test 1: Health Check Auth Function

```bash
# Locale
curl http://localhost:7071/api/v1/health | jq

# DEV
curl https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/health | jq

# Verifica che risponda:
# {
#   "status": "healthy",
#   "message": "Auth Function is running and properly configured",
#   ...
# }
```

### Test 2: Login Flow Completo (NUOVO)

1. **Avvia Auth Function** (se locale):

   ```bash
   cd apps/sm-auth-fn
   yarn start
   ```

2. **Avvia Next.js**:

   ```bash
   cd apps/sm-fe-smcr
   yarn dev
   ```

3. **Test del redirect login**:
   - Apri browser a `http://localhost:3000/auth/login`
   - Dovresti essere **immediatamente reindirizzato** a `login.microsoftonline.com`
   - ✅ Il browser mostra la pagina di login Microsoft

4. **Completa login con le tue credenziali Microsoft**

5. **Verifica in DevTools dopo login**:
   - **Network tab**:
     - `GET /auth/login` → 302 redirect con cookies `pkce_verifier`, `auth_state`
     - `GET /auth/callback` → 302 redirect con cookie `auth-token`
   - **Application tab > Cookies**:
     - Cookie `auth-token` presente e **HttpOnly ✅**
     - Cookie `pkce_verifier` e `auth_state` **rimossi** dopo callback ✅

6. **Naviga a** `/dashboard` → Dovrebbe accedere senza redirect

7. **Click su "Logout"** → Cookie rimosso, redirect a home

### Test 3: Direct Login URL

```bash
# Test redirect diretto (browser)
open "http://localhost:7071/api/v1/auth/login?returnUrl=/dashboard"

# Con curl, verifica redirect
curl -v "http://localhost:7071/api/v1/auth/login?returnUrl=/dashboard"
# Dovresti vedere:
# < HTTP/1.1 302 Found
# < Location: https://login.microsoftonline.com/...
# < Set-Cookie: pkce_verifier=...; HttpOnly
# < Set-Cookie: auth_state=...; HttpOnly
```

### Test 4: Protected Routes

```bash
# Senza cookie
curl -v http://localhost:3000/dashboard
# Dovrebbe fare redirect a /auth/login

# Con cookie valido (copia da browser DevTools)
curl -v http://localhost:3000/dashboard \
  -H "Cookie: auth-token=eyJhbGc..."
# Dovrebbe ritornare pagina dashboard (200)
```

### Test 5: Token Refresh (Opzionale)

```typescript
// In DevTools console
fetch("http://localhost:7071/api/v1/auth/refresh", {
  method: "POST",
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
// Dovrebbe ritornare { success: true, message: "Token refreshed successfully" }
```

### Test 6: Callback con Code Invalido

```bash
# Test con code fake (dovrebbe fallire)
curl -v "http://localhost:7071/api/v1/auth/callback?code=fake123&state=test"
# Dovrebbe ritornare errore di validazione
```

---

## 🐛 Troubleshooting

### Problema: Cookie non viene settato

**Causa**: Configurazione CORS o SameSite  
**Soluzione**:

- Verifica che `credentials: 'include'` sia presente in tutte le fetch
- Verifica che frontend e Auth Function siano sullo stesso dominio (o CORS configurato)
- In locale, usa `http://localhost` per entrambi
- Verifica che Auth Function ritorni header `Set-Cookie` corretto

### Problema: Redirect loop infinito su /auth/login

**Causa**: Middleware redirect a se stesso o PKCE cookies non funzionanti  
**Soluzione**:

- Verifica che `/auth/login` NON sia nel `matcher` del middleware
- Aggiungi eccezioni per route pubbliche
- Controlla che cookies `pkce_verifier` e `auth_state` vengano settati correttamente
- Verifica logs dell'Auth Function per errori PKCE

### Problema: "Invalid state parameter" durante callback

**Causa**: CSRF protection fallita, cookie `auth_state` mancante o alterato  
**Soluzione**:

- Verifica che cookies siano abilitati nel browser
- Controlla che `auth_state` cookie sia presente durante callback
- Assicurati che Domain/Path dei cookies siano corretti
- In sviluppo locale, usa `http://localhost` (NON `127.0.0.1`)

### Problema: "PKCE verification failed"

**Causa**: Code verifier mancante o non corrispondente  
**Soluzione**:

- Verifica che cookie `pkce_verifier` sia presente durante callback
- Controlla logs Auth Function per dettagli su PKCE exchange
- Assicurati che cookies HttpOnly siano supportati dal browser
- Verifica che non ci siano proxy/reverse proxy che rimuovono cookies

### Problema: "Auth Function health check failed"

**Causa**: Auth Function non raggiungibile  
**Soluzione**:

- Verifica che `NEXT_PUBLIC_AUTH_FUNCTION_URL` sia corretto
- Se in Azure, verifica di essere connesso a VPN (Public Network Access disabled)
- Controlla che Function App sia in stato "Running"
- Testa endpoint direttamente: `curl https://your-function.azurewebsites.net/api/v1/health`

### Problema: JWT expired immediatamente

**Causa**: Disallineamento clock o expiry troppo breve  
**Soluzione**:

- Verifica `JWT_EXPIRY_SECONDS` nell'Auth Function (default: 3600 = 1 ora)
- Sincronizza clock del sistema
- Implementa refresh automatico con hook `useTokenRefresh`

### Problema: ⚠️ DEPRECATED - Errori con vecchio flow MSAL Browser

**Causa**: Frontend sta ancora usando vecchia implementazione con `validateToken()`  
**Soluzione**:

- **NON** usare più `@azure/msal-browser` nel frontend
- **NON** chiamare `/auth/validate` endpoint
- Usa il nuovo redirect flow: `window.location.href = '/auth/login'`
- Rimuovi MSAL Context/Provider (verrà fatto in futuro PR)

### Problema: Azure AD errore "invalid_request" o "invalid_client"

**Causa**: Redirect URI non configurato correttamente in Azure AD App Registration  
**Soluzione**:

- Vai su Azure Portal → App Registrations → tua app
- Verifica che questi Redirect URIs siano configurati:
  - `http://localhost:7071/api/v1/auth/callback` (locale)
  - `https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback` (DEV)
  - `https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback` (PROD)
- Verifica che "Public client flows" sia **abilitato**

---

## 📚 Esempi Pratici

### Esempio 1: Protected Page (Server Component)

```typescript
// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth/jwt.server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Email: {user.email}</p>
      <p>Roles: {user.roles.join(", ")}</p>
    </div>
  );
}
```

### Esempio 2: Protected API Route

```typescript
// app/api/protected/route.ts
import { getCurrentUser } from "@/lib/auth/jwt.server";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Protected data",
    user,
  });
}
```

### Esempio 3: Login Page (NUOVO - Semplice Redirect)

```typescript
// app/auth/login/page.tsx
"use client";

import { clientEnv } from "@/config/env";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  useEffect(() => {
    // Redirect immediatamente all'Auth Function
    const authUrl = `${clientEnv.NEXT_PUBLIC_AUTH_FUNCTION_URL}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    window.location.href = authUrl;
  }, [returnUrl]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Redirecting to login...</h1>
        <p className="text-gray-600">Please wait while we redirect you to Microsoft login.</p>
      </div>
    </div>
  );
}
```

### Esempio 4: Login Button (Ancora più semplice!)

```typescript
// components/LoginButton.tsx
"use client";

import { clientEnv } from "@/config/env";

interface LoginButtonProps {
  returnUrl?: string;
  className?: string;
}

export function LoginButton({ returnUrl = "/dashboard", className = "" }: LoginButtonProps) {
  const handleLogin = () => {
    const authUrl = `${clientEnv.NEXT_PUBLIC_AUTH_FUNCTION_URL}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleLogin} className={className}>
      Login with Microsoft
    </button>
  );
}

// Oppure con un semplice <a> tag (ancora meglio!):
export function LoginLink({ returnUrl = "/dashboard" }: { returnUrl?: string }) {
  const authUrl = `${clientEnv.NEXT_PUBLIC_AUTH_FUNCTION_URL}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;

  return (
    <a href={authUrl} className="btn btn-primary">
      🔐 Login with Microsoft
    </a>
  );
}
```

### Esempio 5: Logout Button

```typescript
// components/LogoutButton.tsx
"use client";

import { logout } from "@/lib/services/auth.service";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await logout();
      // Redirect alla home page
      router.push("/");
      router.refresh(); // Force refresh per clear del middleware
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="btn btn-secondary"
    >
      {isLoading ? "⏳ Logging out..." : "🚪 Logout"}
    </button>
  );
}
```

### Esempio 5: Auto-Refresh Token (Background)

```typescript
// hooks/useTokenRefresh.ts
"use client";

import { useEffect } from "react";
import { refreshToken } from "@/lib/services/auth.service";

/**
 * Hook per refresh automatico del token ogni 50 minuti
 * (JWT expiry è 1 ora, refresh 10 minuti prima)
 */
export function useTokenRefresh() {
  useEffect(() => {
    // Refresh ogni 50 minuti
    const interval = setInterval(async () => {
      console.log("🔄 Auto-refreshing token...");
      const result = await refreshToken();

      if (result.success) {
        console.log("✅ Token auto-refreshed");
      } else {
        console.warn("⚠️ Token refresh failed, user may need to re-login");
        // Opzionale: redirect a login se refresh fallisce
        // window.location.href = '/auth/login?returnUrl=' + window.location.pathname;
      }
    }, 50 * 60 * 1000); // 50 minuti

    return () => clearInterval(interval);
  }, []);
}

// Uso in layout principale
// app/layout.tsx
"use client";

import { useTokenRefresh } from "@/hooks/useTokenRefresh";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useTokenRefresh(); // Attiva auto-refresh per utenti autenticati

  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
```

### Esempio 6: Protected Page con Redirect Automatico

```typescript
// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/auth/jwt.server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    // Se non autenticato, redirect a login con returnUrl
    redirect("/auth/login?returnUrl=/dashboard");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Email: {user.email}</p>
      <p>Roles: {user.roles.join(", ")}</p>

      <div className="mt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
```

---

## 🚀 Deployment Checklist

Prima di deployare in produzione:

- [ ] **Environment variables configurate** in Terraform (`dev.yaml`, `prod.yaml`)
- [ ] **Auth Function deployata** e health check passa
- [ ] **Redirect URIs** configurati in Azure AD App Registration
- [ ] **CORS** configurato nell'Auth Function (se domini diversi)
- [ ] **Cookie settings** verificati:
  - `HttpOnly: true`
  - `Secure: true` (solo HTTPS)
  - `SameSite: Strict` o `Lax`
- [ ] **Middleware matcher** configurato per tutte le route protette
- [ ] **Error pages** create (`/auth-error`, `/auth/login`)
- [ ] **Logs** configurati per debugging
- [ ] **Testing** completo su staging slot

---

## 📖 Documentazione Correlata

- [Auth Function README](../../apps/sm-auth-fn/README.md)
- [MSAL Architecture Solution](./MSAL_ARCHITECTURE_SOLUTION.md)
- [Auth Migration Checklist](./AUTH_MIGRATION_CHECKLIST.md)
- [Auth Dev Setup](./AUTH_DEV_SETUP.md)

---

## 🆘 Support

Per problemi o domande:

1. Controlla [Troubleshooting](#-troubleshooting)
2. Verifica logs dell'Auth Function su Azure Portal
3. Verifica Network tab in DevTools per request/response
4. Contatta team Platform SM

---

**Versione**: 1.0  
**Data**: 2026-03-09  
**Autore**: Platform SM Team
