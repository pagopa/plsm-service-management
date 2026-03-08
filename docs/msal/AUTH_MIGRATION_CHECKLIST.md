---
title: "Checklist Completa: Migrazione Auth MSAL su Azure Function"
author: "Lorenzo Franceschini + AI Assistant"
date: 2026-03-08
version: 1.0
status: "DA COMPLETARE"
---

# 🔐 Checklist Completa: Auth as a Service Migration

## 📋 FASE 0: PREPARAZIONE & VERIFICA INFRA

### ✅ Verifica Infra Esistente

- [x] **Terraform per Auth Function esistente**
  - File: `infra/resources/prod/auth_func.tf` ✅
  - Modulo: `function_app` configurato
  - Health check: `/api/v1/health`
  - Node version: 22
  - VNet integration: configurata

- [x] **Configurazione YAML esistente**
  - File: `infra/resources/environments/prod.yaml` (linea 124-127) ✅
  - Locals generati: `infra/resources/prod/locals_yaml.tf` (linea 137-142) ✅
  - Attualmente solo: NODE_ENV, WEBSITE_RUN_FROM_PACKAGE

### 🔑 Azure AD App Registration

- [ ] **Verificare/Creare App Registration**
  - [ ] Aprire Azure Portal → Azure Active Directory → App registrations
  - [ ] Verificare esistenza app: `plsm-p-platformsm` (o simile)
  - [ ] Annotare:
    - Client ID: `_____________________________`
    - Tenant ID: `_____________________________`
- [ ] **Verificare/Creare Client Secret**
  - [ ] Andare in "Certificates & secrets"
  - [ ] Se non esiste, creare nuovo Client Secret
  - [ ] Annotare il **Value** (visibile solo alla creazione!)
    - Client Secret: `_____________________________`
  - [ ] Verificare scadenza (max 24 mesi, consigliato 12 mesi)
    - Data scadenza: `_____________________________`
- [ ] **Aggiornare Redirect URIs**
  - [ ] Andare in "Authentication"
  - [ ] **RIMUOVERE** vecchio URI:
    - ❌ `https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/api/auth/callback/microsoft`
  - [ ] **AGGIUNGERE** nuovo URI:
    - ✅ `https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/api/auth/callback` (senza `/microsoft`)
  - [ ] **AGGIUNGERE** URI staging:
    - ✅ `https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net/api/auth/callback`
- [ ] **Verificare API Permissions**
  - [ ] Microsoft Graph:
    - [ ] `User.Read` (delegated)
    - [ ] `email` (delegated)
    - [ ] `openid` (delegated)
    - [ ] `profile` (delegated)
  - [ ] Verificare che "Admin consent" sia concesso (✅ verde)

### 🔐 Azure Key Vault - Creare Secrets

- [ ] **Aprire Key Vault**: `plsm-p-itn-common-kv-01`
- [ ] **Creare secrets per MSAL** (formato: `lowercase-with-dashes`)

  ```bash
  # Nel portale Azure o via CLI:

  # 1. Client ID
  az keyvault secret set \
    --vault-name plsm-p-itn-common-kv-01 \
    --name auth-msal-client-id \
    --value "<INSERIRE_CLIENT_ID>"

  # 2. Tenant ID
  az keyvault secret set \
    --vault-name plsm-p-itn-common-kv-01 \
    --name auth-msal-tenant-id \
    --value "<INSERIRE_TENANT_ID>"

  # 3. Client Secret
  az keyvault secret set \
    --vault-name plsm-p-itn-common-kv-01 \
    --name auth-msal-client-secret \
    --value "<INSERIRE_CLIENT_SECRET>"

  # 4. JWT Secret (generare con openssl)
  az keyvault secret set \
    --vault-name plsm-p-itn-common-kv-01 \
    --name auth-jwt-secret \
    --value "$(openssl rand -hex 32)"
  ```

  **Checklist secrets:**
  - [ ] `auth-msal-client-id` creato
  - [ ] `auth-msal-tenant-id` creato
  - [ ] `auth-msal-client-secret` creato
  - [ ] `auth-jwt-secret` creato (e annotato in password manager!)

### 📝 Aggiornare infra/resources/prod/data.tf

- [ ] **Aggiungere data sources per i nuovi secrets**

  Aprire: `infra/resources/prod/data.tf`

  Aggiungere dopo la linea 67 (dopo `fe_smcr_plsm_p_platformsm_client_id`):

  ```hcl
  # -----------------------------------------------------------------------------
  # Auth Function Secrets
  # -----------------------------------------------------------------------------

  data "azurerm_key_vault_secret" "auth_msal_client_id" {
    name         = "auth-msal-client-id"
    key_vault_id = module.azure_core_infra.common_key_vault.id
  }

  data "azurerm_key_vault_secret" "auth_msal_tenant_id" {
    name         = "auth-msal-tenant-id"
    key_vault_id = module.azure_core_infra.common_key_vault.id
  }

  data "azurerm_key_vault_secret" "auth_msal_client_secret" {
    name         = "auth-msal-client-secret"
    key_vault_id = module.azure_core_infra.common_key_vault.id
  }

  data "azurerm_key_vault_secret" "auth_jwt_secret" {
    name         = "auth-jwt-secret"
    key_vault_id = module.azure_core_infra.common_key_vault.id
  }
  ```

### 📝 Aggiornare infra/resources/environments/prod.yaml

- [ ] **Modificare sezione `auth_func`**

  Aprire: `infra/resources/environments/prod.yaml`

  **SOSTITUIRE** le linee 124-127 con:

  ```yaml
  # ─── Auth Function ─────────────────────────────────────────────────────

  auth_func:
    __local: yaml_auth_func
    NODE_ENV: "production"
    WEBSITE_RUN_FROM_PACKAGE: "1"
    # MSAL Configuration
    MSAL_CLIENT_ID: "kv:auth_msal_client_id"
    MSAL_TENANT_ID: "kv:auth_msal_tenant_id"
    MSAL_CLIENT_SECRET: "kv:auth_msal_client_secret"
    MSAL_REDIRECT_URI: "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/api/auth/callback"
    # JWT Configuration
    JWT_SECRET: "kv:auth_jwt_secret"
    JWT_EXPIRY_SECONDS: "3600" # 1 ora
    JWT_ISSUER: "plsm-auth-service"
    JWT_AUDIENCE: "plsm-fe-smcr"
  ```

- [ ] **Modificare sezione `fe_smcr` - PRODUCTION**

  Trovare la sezione `production:` (circa linea 95-98) e:

  **AGGIUNGERE** dopo `NEXT_PUBLIC_POST_LOGIN_REDIRECT`:

  ```yaml
  AUTH_FUNCTION_BASE_URL: "https://plsm-p-itn-auth-func-01.azurewebsites.net"
  ```

  **RIMUOVERE** (commenta con `#` per sicurezza):

  ```yaml
  # NEXT_PUBLIC_MSAL_CLIENT_ID: "kv:fe_smcr_plsm_p_platformsm_client_id"  # ← RIMOSSO
  # NEXT_PUBLIC_MSAL_TENANT_ID: "kv:fe_smcr_plsm_p_platformsm_tenant_id"  # ← RIMOSSO
  ```

- [ ] **Modificare sezione `fe_smcr` - STAGING**

  Trovare la sezione `staging:` (circa linea 100-102) e:

  **AGGIUNGERE**:

  ```yaml
  AUTH_FUNCTION_BASE_URL: "https://plsm-p-itn-auth-func-01-staging.azurewebsites.net"
  ```

### 🔧 Rigenerare Terraform Locals

- [ ] **Eseguire script di generazione**

  ```bash
  cd /Users/lorenzo.franceschini/dev/pagopa/plsm-service-management
  python3 infra/scripts/generate_locals.py
  ```

- [ ] **Verificare file generati**
  - [ ] Aprire `infra/resources/prod/locals_yaml.tf`
  - [ ] Verificare sezione `yaml_auth_func_app_settings` (circa linea 137)
  - [ ] Verificare che contenga i nuovi valori MSAL e JWT
  - [ ] Verificare sezione `yaml_fe_smcr_app_settings` per AUTH_FUNCTION_BASE_URL

### 🌐 Verifica Networking

- [ ] **VNet Integration**
  - [ ] Verificare che `sm-auth-fn` sia nella stessa VNet di `sm-fe-smcr`
  - [ ] VNet: `plsm-p-itn-common-vnet-01`
  - [ ] Subnet auth function: verificare CIDR allocato
- [ ] **Firewall Rules**
  - [ ] Verificare che Next.js possa chiamare Auth Function
  - [ ] Se Auth Function è privata, verificare Private Endpoint
  - [ ] Testare connectivity: `curl https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/health`

---

## 🛠️ FASE 1: CREARE `apps/sm-auth-fn`

### 📁 Setup Iniziale

- [ ] **Creare struttura directory**
  ```bash
  cd apps
  mkdir -p sm-auth-fn/{_shared,health,auth-login,auth-exchange,auth-validate,auth-logout}
  cd sm-auth-fn
  ```

### 📦 package.json

- [ ] **Creare `apps/sm-auth-fn/package.json`**
  ```json
  {
    "name": "sm-auth-fn",
    "version": "1.0.0",
    "main": "dist/**/*/index.js",
    "scripts": {
      "build": "tsc",
      "start": "func start",
      "test": "echo \"No tests yet\" && exit 0"
    },
    "dependencies": {
      "@azure/functions": "^4.10.0",
      "@azure/msal-node": "^3.6.1",
      "jsonwebtoken": "^9.0.2",
      "zod": "^4.1.8"
    },
    "devDependencies": {
      "@types/jsonwebtoken": "^9.0.5",
      "@types/node": "^24.1.2",
      "typescript": "^5.9.3"
    }
  }
  ```

### ⚙️ Configurazione

- [ ] **Creare `apps/sm-auth-fn/tsconfig.json`**

  ```json
  {
    "extends": "@repo/typescript-config/base.json",
    "compilerOptions": {
      "outDir": "dist",
      "rootDir": ".",
      "module": "commonjs",
      "target": "ES2020",
      "esModuleInterop": true,
      "skipLibCheck": true,
      "strict": true
    },
    "include": ["**/*.ts"],
    "exclude": ["node_modules", "dist", "test"]
  }
  ```

- [ ] **Creare `apps/sm-auth-fn/host.json`**

  ```json
  {
    "version": "2.0",
    "logging": {
      "applicationInsights": {
        "samplingSettings": {
          "isEnabled": true,
          "excludedTypes": "Request"
        }
      }
    },
    "extensionBundle": {
      "id": "Microsoft.Azure.Functions.ExtensionBundle",
      "version": "[4.*, 5.0.0)"
    },
    "extensions": {
      "http": {
        "routePrefix": "api/v1"
      }
    }
  }
  ```

- [ ] **Creare `apps/sm-auth-fn/.gitignore`**

  ```
  node_modules/
  dist/
  .env
  local.settings.json
  .turbo/
  *.log
  .DS_Store
  ```

- [ ] **Creare `apps/sm-auth-fn/local.settings.json.example`**
  ```json
  {
    "IsEncrypted": false,
    "Values": {
      "AzureWebJobsStorage": "UseDevelopmentStorage=true",
      "FUNCTIONS_WORKER_RUNTIME": "node",
      "NODE_ENV": "development",
      "MSAL_CLIENT_ID": "your-client-id",
      "MSAL_TENANT_ID": "your-tenant-id",
      "MSAL_CLIENT_SECRET": "your-client-secret",
      "MSAL_REDIRECT_URI": "http://localhost:3000/api/auth/callback",
      "JWT_SECRET": "your-local-jwt-secret-min-32-chars",
      "JWT_EXPIRY_SECONDS": "3600",
      "JWT_ISSUER": "plsm-auth-service",
      "JWT_AUDIENCE": "plsm-fe-smcr"
    }
  }
  ```

### 🔧 Shared Modules

- [ ] **Creare `apps/sm-auth-fn/_shared/types.ts`**

  ```typescript
  export interface AuthClaims {
    userId: string;
    email: string;
    name?: string;
    roles?: string[];
    tenantId: string;
  }

  export interface TokenResponse {
    token: string;
    claims: AuthClaims;
    expiresIn: number;
  }

  export interface ErrorResponse {
    error: string;
    message: string;
    timestamp: string;
  }
  ```

- [ ] **Creare `apps/sm-auth-fn/_shared/msalConfig.ts`**

  ```typescript
  import {
    ConfidentialClientApplication,
    Configuration,
  } from "@azure/msal-node";

  const msalConfig: Configuration = {
    auth: {
      clientId: process.env.MSAL_CLIENT_ID!,
      authority: `https://login.microsoftonline.com/${process.env.MSAL_TENANT_ID}`,
      clientSecret: process.env.MSAL_CLIENT_SECRET!,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          console.log(`[MSAL] ${message}`);
        },
        piiLoggingEnabled: false,
        logLevel: process.env.NODE_ENV === "production" ? 3 : 2, // Error in prod, Trace in dev
      },
    },
  };

  export const msalClient = new ConfidentialClientApplication(msalConfig);
  ```

- [ ] **Creare `apps/sm-auth-fn/_shared/jwtUtils.ts`**

  ```typescript
  import jwt from "jsonwebtoken";
  import type { AuthClaims } from "./types";

  const JWT_SECRET = process.env.JWT_SECRET!;
  const JWT_EXPIRY_SECONDS = parseInt(
    process.env.JWT_EXPIRY_SECONDS || "3600",
    10,
  );
  const JWT_ISSUER = process.env.JWT_ISSUER || "plsm-auth-service";
  const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "plsm-fe-smcr";

  export function signJWT(claims: AuthClaims): string {
    return jwt.sign(claims, JWT_SECRET, {
      expiresIn: JWT_EXPIRY_SECONDS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  export function verifyJWT(token: string): AuthClaims | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }) as AuthClaims;
      return decoded;
    } catch (error) {
      console.error("[JWT] Verification failed:", error);
      return null;
    }
  }

  export function getExpirySeconds(): number {
    return JWT_EXPIRY_SECONDS;
  }
  ```

- [ ] **Creare `apps/sm-auth-fn/_shared/env.ts`**

  ```typescript
  import { z } from "zod";

  const envSchema = z.object({
    MSAL_CLIENT_ID: z.string().min(1),
    MSAL_TENANT_ID: z.string().uuid(),
    MSAL_CLIENT_SECRET: z.string().min(1),
    MSAL_REDIRECT_URI: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRY_SECONDS: z.string().regex(/^\d+$/),
    JWT_ISSUER: z.string().optional(),
    JWT_AUDIENCE: z.string().optional(),
    NODE_ENV: z.enum(["development", "production"]).optional(),
  });

  export function validateEnv(): void {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error("[ENV] Validation failed:", result.error.format());
      throw new Error("Invalid environment variables");
    }
  }
  ```

### 🏥 Health Check Endpoint

- [ ] **Creare `apps/sm-auth-fn/health/index.ts`**

  ```typescript
  import { app } from "@azure/functions";
  import { handler } from "./handler";

  app.http("health", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "health",
    handler,
  });
  ```

- [ ] **Creare `apps/sm-auth-fn/health/handler.ts`**

  ```typescript
  import type {
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
  } from "@azure/functions";

  export async function handler(
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> {
    return {
      status: 200,
      jsonBody: {
        status: "healthy",
        service: "sm-auth-fn",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }
  ```

### 🔐 Auth Endpoints

#### 1️⃣ auth-login

- [ ] **Creare `apps/sm-auth-fn/auth-login/index.ts`**

  ```typescript
  import { app } from "@azure/functions";
  import { handler } from "./handler";

  app.http("auth-login", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "auth/login",
    handler,
  });
  ```

- [ ] **Creare `apps/sm-auth-fn/auth-login/handler.ts`**

  ```typescript
  import type {
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
  } from "@azure/functions";
  import { msalClient } from "../_shared/msalConfig";
  import type { ErrorResponse } from "../_shared/types";

  export async function handler(
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> {
    try {
      const authCodeUrlParameters = {
        scopes: ["user.read", "openid", "profile", "email"],
        redirectUri: process.env.MSAL_REDIRECT_URI!,
      };

      const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);

      return {
        status: 200,
        jsonBody: {
          authUrl,
        },
      };
    } catch (error) {
      context.error("[auth-login] Error generating auth URL:", error);
      const errorResponse: ErrorResponse = {
        error: "auth_error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate auth URL",
        timestamp: new Date().toISOString(),
      };
      return {
        status: 500,
        jsonBody: errorResponse,
      };
    }
  }
  ```

#### 2️⃣ auth-exchange

- [ ] **Creare `apps/sm-auth-fn/auth-exchange/index.ts`**

  ```typescript
  import { app } from "@azure/functions";
  import { handler } from "./handler";

  app.http("auth-exchange", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "auth/exchange",
    handler,
  });
  ```

- [ ] **Creare `apps/sm-auth-fn/auth-exchange/handler.ts`**

  ```typescript
  import type {
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
  } from "@azure/functions";
  import { z } from "zod";
  import { msalClient } from "../_shared/msalConfig";
  import { signJWT, getExpirySeconds } from "../_shared/jwtUtils";
  import type {
    AuthClaims,
    TokenResponse,
    ErrorResponse,
  } from "../_shared/types";

  const requestSchema = z.object({
    code: z.string().min(1),
    redirectUri: z.string().url(),
  });

  export async function handler(
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> {
    try {
      const body = await request.json();
      const { code, redirectUri } = requestSchema.parse(body);

      // Exchange authorization code for tokens
      const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        redirectUri,
        scopes: ["user.read", "openid", "profile", "email"],
      });

      if (!tokenResponse) {
        throw new Error("No token response from MSAL");
      }

      // Extract claims from ID token
      const claims: AuthClaims = {
        userId:
          tokenResponse.uniqueId || tokenResponse.account?.localAccountId || "",
        email: tokenResponse.account?.username || "",
        name: tokenResponse.account?.name,
        tenantId: tokenResponse.account?.tenantId || "",
        roles: [], // TODO: Add role mapping logic
      };

      // Sign JWT with claims
      const jwt = signJWT(claims);

      const response: TokenResponse = {
        token: jwt,
        claims,
        expiresIn: getExpirySeconds(),
      };

      return {
        status: 200,
        jsonBody: response,
      };
    } catch (error) {
      context.error("[auth-exchange] Error exchanging code:", error);

      let statusCode = 500;
      let errorMessage = "Token exchange failed";

      if (error instanceof z.ZodError) {
        statusCode = 400;
        errorMessage = "Invalid request body";
      }

      const errorResponse: ErrorResponse = {
        error: "token_exchange_error",
        message: error instanceof Error ? error.message : errorMessage,
        timestamp: new Date().toISOString(),
      };

      return {
        status: statusCode,
        jsonBody: errorResponse,
      };
    }
  }
  ```

#### 3️⃣ auth-validate

- [ ] **Creare `apps/sm-auth-fn/auth-validate/index.ts`**

  ```typescript
  import { app } from "@azure/functions";
  import { handler } from "./handler";

  app.http("auth-validate", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "auth/validate",
    handler,
  });
  ```

- [ ] **Creare `apps/sm-auth-fn/auth-validate/handler.ts`**

  ```typescript
  import type {
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
  } from "@azure/functions";
  import { verifyJWT } from "../_shared/jwtUtils";
  import type { ErrorResponse } from "../_shared/types";

  export async function handler(
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> {
    try {
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const errorResponse: ErrorResponse = {
          error: "unauthorized",
          message: "Missing or invalid Authorization header",
          timestamp: new Date().toISOString(),
        };
        return {
          status: 401,
          jsonBody: errorResponse,
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer '
      const claims = verifyJWT(token);

      if (!claims) {
        const errorResponse: ErrorResponse = {
          error: "invalid_token",
          message: "Token validation failed",
          timestamp: new Date().toISOString(),
        };
        return {
          status: 401,
          jsonBody: errorResponse,
        };
      }

      return {
        status: 200,
        jsonBody: {
          valid: true,
          claims,
        },
      };
    } catch (error) {
      context.error("[auth-validate] Error validating token:", error);
      const errorResponse: ErrorResponse = {
        error: "validation_error",
        message:
          error instanceof Error ? error.message : "Token validation error",
        timestamp: new Date().toISOString(),
      };
      return {
        status: 500,
        jsonBody: errorResponse,
      };
    }
  }
  ```

#### 4️⃣ auth-logout

- [ ] **Creare `apps/sm-auth-fn/auth-logout/index.ts`**

  ```typescript
  import { app } from "@azure/functions";
  import { handler } from "./handler";

  app.http("auth-logout", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "auth/logout",
    handler,
  });
  ```

- [ ] **Creare `apps/sm-auth-fn/auth-logout/handler.ts`**

  ```typescript
  import type {
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
  } from "@azure/functions";

  export async function handler(
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> {
    // Stateless logout: client is responsible for removing cookies
    // In future, could implement token revocation list (Redis/DB)

    context.log("[auth-logout] Logout request received");

    return {
      status: 200,
      jsonBody: {
        message: "Logout successful",
        timestamp: new Date().toISOString(),
      },
    };
  }
  ```

### 📚 Documentazione

- [ ] **Creare `apps/sm-auth-fn/README.md`**

  ```markdown
  # SM Auth Function

  Authentication as a Service using MSAL-node for Azure AD.

  ## Setup

  1. Copy `local.settings.json.example` to `local.settings.json`
  2. Fill in your Azure AD credentials
  3. Run `yarn install`
  4. Run `yarn build`
  5. Run `yarn start`

  ## Endpoints

  - `GET /api/v1/health` - Health check
  - `GET /api/v1/auth/login` - Get Azure AD login URL
  - `POST /api/v1/auth/exchange` - Exchange auth code for JWT
  - `GET /api/v1/auth/validate` - Validate JWT token
  - `POST /api/v1/auth/logout` - Logout (stateless)

  ## Environment Variables

  See `local.settings.json.example` for required variables.
  ```

### ✅ Build & Test Local

- [ ] **Installare dipendenze**

  ```bash
  cd apps/sm-auth-fn
  yarn install
  ```

- [ ] **Compilare TypeScript**

  ```bash
  yarn build
  # Verificare che dist/ contenga i file compilati
  ```

- [ ] **Creare `local.settings.json`** (copiare da `.example` e inserire valori reali)

- [ ] **Avviare function localmente**

  ```bash
  yarn start
  # Dovrebbe avviarsi su http://localhost:7071
  ```

- [ ] **Testare endpoints locali**

  ```bash
  # Health check
  curl http://localhost:7071/api/v1/health

  # Login (dovrebbe restituire authUrl)
  curl http://localhost:7071/api/v1/auth/login
  ```

---

## 🔄 FASE 2: MODIFICHE A `apps/sm-fe-smcr`

### 📦 Aggiornare package.json

- [ ] **Aprire `apps/sm-fe-smcr/package.json`**
- [ ] **RIMUOVERE** dipendenze MSAL client-side:

  ```bash
  cd apps/sm-fe-smcr
  yarn remove @azure/msal-browser @azure/msal-react @azure/msal-node
  ```

- [ ] **Verificare rimozione** da `package.json` (linee 17-19):
  - ❌ `@azure/msal-browser`
  - ❌ `@azure/msal-react`
  - ❌ `@azure/msal-node`

### ❌ Eliminare File Obsoleti

- [ ] **Eliminare configurazione MSAL client**

  ```bash
  cd apps/sm-fe-smcr
  rm lib/msalConfig.ts
  ```

- [ ] **Eliminare provider MSAL**

  ```bash
  rm context/MSALproviders.tsx
  ```

- [ ] **Eliminare vecchia callback route**

  ```bash
  rm -rf app/api/auth/callback/microsoft/
  ```

- [ ] **Verificare eliminazione**:
  - [ ] `lib/msalConfig.ts` eliminato
  - [ ] `context/MSALproviders.tsx` eliminato
  - [ ] `app/api/auth/callback/microsoft/` eliminato

### ➕ Creare Nuovi File

#### 1️⃣ Environment Config

- [ ] **Modificare `apps/sm-fe-smcr/config/env.ts`**

  **RIMUOVERE** (o commentare):

  ```typescript
  // NEXT_PUBLIC_MSAL_CLIENT_ID: z.string().min(1),
  // NEXT_PUBLIC_MSAL_TENANT_ID: z.string().uuid(),
  // NEXT_PUBLIC_MSAL_REDIRECT_URI: z.string().url(),
  ```

  **AGGIUNGERE**:

  ```typescript
  AUTH_FUNCTION_BASE_URL: z.string().url(),
  ```

#### 2️⃣ Auth Utils

- [ ] **Creare `apps/sm-fe-smcr/lib/authClient.ts`**

  ```typescript
  const AUTH_BASE_URL = process.env.AUTH_FUNCTION_BASE_URL!;

  export interface AuthClaims {
    userId: string;
    email: string;
    name?: string;
    roles?: string[];
    tenantId: string;
  }

  export interface TokenResponse {
    token: string;
    claims: AuthClaims;
    expiresIn: number;
  }

  export async function getLoginUrl(): Promise<string> {
    const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`);
    if (!response.ok) throw new Error("Failed to get login URL");
    const data = await response.json();
    return data.authUrl;
  }

  export async function exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri }),
    });
    if (!response.ok) throw new Error("Token exchange failed");
    return response.json();
  }

  export async function validateToken(
    token: string,
  ): Promise<{ valid: boolean; claims?: AuthClaims }> {
    const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { valid: false };
    return response.json();
  }

  export async function logout(): Promise<void> {
    await fetch(`${AUTH_BASE_URL}/api/v1/auth/logout`, { method: "POST" });
  }
  ```

#### 3️⃣ API Routes

- [ ] **Creare `apps/sm-fe-smcr/app/api/auth/login/route.ts`**

  ```typescript
  import { NextResponse } from "next/server";
  import { getLoginUrl } from "@/lib/authClient";

  export async function GET() {
    try {
      const authUrl = await getLoginUrl();
      return NextResponse.redirect(authUrl);
    } catch (error) {
      console.error("[auth/login] Error:", error);
      return NextResponse.json(
        { error: "Failed to initiate login" },
        { status: 500 },
      );
    }
  }
  ```

- [ ] **Creare `apps/sm-fe-smcr/app/api/auth/callback/route.ts`**

  ```typescript
  import { NextRequest, NextResponse } from "next/server";
  import { exchangeCodeForToken } from "@/lib/authClient";
  import { cookies } from "next/headers";

  export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("[auth/callback] OAuth error:", error);
      return NextResponse.redirect(new URL("/?auth_error=true", request.url));
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/?auth_error=missing_code", request.url),
      );
    }

    try {
      const redirectUri = new URL("/api/auth/callback", request.url).toString();
      const tokenResponse = await exchangeCodeForToken(code, redirectUri);

      // Set HttpOnly cookie with JWT
      cookies().set("session", tokenResponse.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokenResponse.expiresIn,
        path: "/",
      });

      // Redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      console.error("[auth/callback] Token exchange error:", error);
      return NextResponse.redirect(
        new URL("/?auth_error=exchange_failed", request.url),
      );
    }
  }
  ```

- [ ] **Creare `apps/sm-fe-smcr/app/api/auth/logout/route.ts`**

  ```typescript
  import { NextRequest, NextResponse } from "next/server";
  import { logout } from "@/lib/authClient";
  import { cookies } from "next/headers";

  export async function GET(request: NextRequest) {
    try {
      // Call auth function logout (for future token revocation)
      await logout();

      // Delete session cookie
      cookies().delete("session");

      // Redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    } catch (error) {
      console.error("[auth/logout] Error:", error);
      // Still delete cookie even if auth function call fails
      cookies().delete("session");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  ```

- [ ] **Creare `apps/sm-fe-smcr/app/api/auth/me/route.ts`** (per client components)

  ```typescript
  import { NextRequest, NextResponse } from "next/server";
  import { validateToken } from "@/lib/authClient";
  import { cookies } from "next/headers";

  export async function GET(request: NextRequest) {
    const sessionCookie = cookies().get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      const result = await validateToken(sessionCookie);

      if (!result.valid) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      return NextResponse.json({
        authenticated: true,
        claims: result.claims,
      });
    } catch (error) {
      console.error("[auth/me] Validation error:", error);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }
  ```

#### 4️⃣ Middleware

- [ ] **Modificare `apps/sm-fe-smcr/middleware.ts`**

  ```typescript
  import { NextResponse } from "next/server";
  import type { NextRequest } from "next/server";
  import { validateToken } from "@/lib/authClient";

  export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;

    // No session cookie → redirect to login
    if (!sessionCookie) {
      const loginUrl = new URL("/api/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate token with Auth Function
    try {
      const result = await validateToken(sessionCookie);

      if (!result.valid || !result.claims) {
        // Invalid token → redirect to login
        const loginUrl = new URL("/api/auth/login", request.url);
        loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Token valid → inject claims as header for server components
      const response = NextResponse.next();
      response.headers.set("x-user-claims", JSON.stringify(result.claims));
      return response;
    } catch (error) {
      console.error("[middleware] Token validation error:", error);
      const loginUrl = new URL("/api/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  export const config = {
    matcher: "/dashboard/:path*",
  };
  ```

#### 5️⃣ Session Provider

- [ ] **Modificare `apps/sm-fe-smcr/context/sessionProvider.tsx`**

  **RIMUOVERE** imports MSAL:

  ```typescript
  // import { useMsal, useAccount } from '@azure/msal-react';
  ```

  **AGGIUNGERE** nuovo fetch logic:

  ```typescript
  'use client';

  import { createContext, useContext, useEffect, useState } from 'react';
  import type { AuthClaims } from '@/lib/authClient';

  interface SessionContextType {
    claims: AuthClaims | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    // ... altri campi esistenti (UserProfile, etc.)
  }

  const SessionContext = createContext<SessionContextType | undefined>(undefined);

  export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [claims, setClaims] = useState<AuthClaims | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Fetch claims from /api/auth/me
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.authenticated) {
            setClaims(data.claims);
          }
        })
        .catch(err => console.error('Failed to fetch session:', err))
        .finally(() => setIsLoading(false));
    }, []);

    // ... resto della logica esistente (profile DB lookup, etc.)

    return (
      <SessionContext.Provider value={{ claims, isLoading, isAuthenticated: !!claims }}>
        {children}
      </SessionContext.Provider>
    );
  }

  export function useSession() {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within SessionProvider');
    return context;
  }
  ```

#### 6️⃣ UI Components

- [ ] **Modificare `apps/sm-fe-smcr/components/auth/login/login.tsx`**

  **SOSTITUIRE** `instance.loginRedirect()` con:

  ```typescript
  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };
  ```

- [ ] **Modificare `apps/sm-fe-smcr/components/auth/logoutbutton.tsx`**

  **SOSTITUIRE** `instance.logoutRedirect()` con:

  ```typescript
  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };
  ```

#### 7️⃣ Layout

- [ ] **Modificare `apps/sm-fe-smcr/app/layout.tsx`**

  **RIMUOVERE**:

  ```typescript
  // import { MSALProvider } from '@/context/MSALproviders';
  ```

  **RIMUOVERE** dal JSX:

  ```tsx
  {
    /* <MSALProvider> */
  }
  <SessionProvider>{children}</SessionProvider>;
  {
    /* </MSALProvider> */
  }
  ```

### ✅ Test Modifiche Frontend

- [ ] **Build Next.js**

  ```bash
  cd apps/sm-fe-smcr
  yarn build
  ```

- [ ] **Verificare nessun errore TypeScript**

  ```bash
  yarn check-types
  ```

- [ ] **Avviare dev server**

  ```bash
  yarn dev
  ```

- [ ] **Testare flusso completo**:
  - [ ] Navigare a `http://localhost:3000/dashboard`
  - [ ] Dovrebbe redirect a `/api/auth/login`
  - [ ] Dovrebbe redirect ad Azure AD
  - [ ] Dopo login, redirect a `/dashboard`
  - [ ] Verificare che `useSession()` restituisca claims corretti
  - [ ] Testare logout

---

## 🚀 FASE 3: DEPLOY & TERRAFORM

### 📝 Verifiche Pre-Deploy

- [ ] **Verificare tutti i files Terraform modificati**:
  - [ ] `infra/resources/prod/data.tf` (nuovi secrets)
  - [ ] `infra/resources/environments/prod.yaml` (auth_func + fe_smcr)
  - [ ] `infra/resources/prod/locals_yaml.tf` (auto-generato)

- [ ] **Rigenerare locals (se non fatto in Fase 0)**:
  ```bash
  python3 infra/scripts/generate_locals.py
  ```

### 🔍 Terraform Plan

- [ ] **Eseguire Terraform plan**

  ```bash
  cd infra/resources/prod
  terraform init
  terraform plan -out=tfplan
  ```

- [ ] **Verificare modifiche previste**:
  - [ ] Auth Function: nuovi app settings (MSAL*\*, JWT*\*)
  - [ ] FE SMCR: aggiunte/modifiche app settings (AUTH_FUNCTION_BASE_URL)
  - [ ] FE SMCR: rimozione NEXT*PUBLIC_MSAL*\* (verificare che non causi problemi)
  - [ ] Nessuna risorsa distrutta/ricreata inaspettatamente

- [ ] **Se tutto ok, salvare plan**

### 🚢 Deploy Infra

- [ ] **Applicare Terraform**

  ```bash
  terraform apply tfplan
  ```

- [ ] **Verificare output**:
  - [ ] Nessun errore
  - [ ] Auth Function app settings aggiornati
  - [ ] FE SMCR app settings aggiornati

### 📦 Deploy Applicazioni

#### Deploy Auth Function

- [ ] **Build Auth Function**

  ```bash
  cd apps/sm-auth-fn
  yarn build
  ```

- [ ] **Creare package di deploy** (se serve script custom come PF)

  ```bash
  # Esempio: zip -r deploy.zip dist/ host.json package.json node_modules/
  # O usare Azure Functions Core Tools:
  func azure functionapp publish plsm-p-itn-auth-func-01
  ```

- [ ] **Verificare deploy riuscito**
  ```bash
  curl https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/health
  # Dovrebbe restituire {"status":"healthy",...}
  ```

#### Deploy Frontend

- [ ] **Build Next.js**

  ```bash
  cd apps/sm-fe-smcr
  yarn build
  ```

- [ ] **Deploy a staging slot** (per test)

  ```bash
  # Usare GitHub Actions o Azure CLI
  # az webapp deployment source config-zip ...
  ```

- [ ] **Testare staging**:
  - [ ] Navigare a `https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net/dashboard`
  - [ ] Verificare redirect e login completo
  - [ ] Verificare claims in session

- [ ] **Swap staging → production**
  ```bash
  az webapp deployment slot swap \
    --name plsm-p-itn-fe-smcr-app-01 \
    --resource-group plsm-p-itn-sm-rg-01 \
    --slot staging
  ```

### ✅ Verifica Post-Deploy

- [ ] **Health checks**

  ```bash
  # Auth Function
  curl https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/health

  # Frontend
  curl https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/
  ```

- [ ] **Test login flow completo** (production):
  - [ ] Navigare a `/dashboard`
  - [ ] Login con Azure AD
  - [ ] Verificare claims corretti
  - [ ] Verificare funzionalità esistenti (DB lookup, API calls)
  - [ ] Testare logout

- [ ] **Verificare logs**:
  - [ ] Application Insights per Auth Function
  - [ ] Application Insights per FE SMCR
  - [ ] Nessun errore critico

- [ ] **Test edge cases**:
  - [ ] Token scaduto (attendere 1 ora o mockare)
  - [ ] Cookie cancellato manualmente
  - [ ] Utente senza permessi (se applicabile)

---

## 🔒 FASE 4: SECURITY & IMPROVEMENTS (Opzionali ma Consigliati)

### 🛡️ CSRF Protection

- [ ] **Implementare state parameter** in auth-login

  ```typescript
  // auth-login/handler.ts
  const state = crypto.randomBytes(16).toString('hex');
  // Store in Redis/Session
  const authUrl = await msalClient.getAuthCodeUrl({
    scopes: [...],
    redirectUri: ...,
    state, // ← Add this
  });
  ```

- [ ] **Validare state** in auth-exchange
  ```typescript
  // auth-exchange/handler.ts
  const { code, state, redirectUri } = requestSchema.parse(body);
  // Validate state from Redis/Session
  ```

### 🚦 Rate Limiting

- [ ] **Aggiungere rate limiting** su endpoints critici
  - [ ] `/auth/login`: max 5 richieste/minuto per IP
  - [ ] `/auth/exchange`: max 3 richieste/minuto per IP
  - [ ] Usare Azure API Management o libreria `express-rate-limit`

### 🔄 Token Refresh

- [ ] **Implementare endpoint `/auth/refresh`**

  ```typescript
  // auth-refresh/handler.ts
  // Input: JWT valido ma in scadenza (< 5 min)
  // Output: nuovo JWT con TTL esteso
  // Usare MSAL refresh token se disponibile
  ```

- [ ] **Modificare middleware** per auto-refresh
  ```typescript
  // middleware.ts
  // Se token scade tra < 5 min → chiamare /auth/refresh
  ```

### 📊 Logging & Monitoring

- [ ] **Aggiungere Application Insights custom events**

  ```typescript
  // Ogni endpoint auth
  context.trackEvent({
    name: "auth_login_success",
    properties: { userId: claims.userId, timestamp: new Date() },
  });
  ```

- [ ] **Creare dashboard Azure**:
  - [ ] Grafico login giornalieri
  - [ ] Errori auth per tipo
  - [ ] Token validation failures

### 🔐 Token Revocation (Advanced)

- [ ] **Implementare token blacklist** con Redis

  ```typescript
  // auth-logout/handler.ts
  // Aggiungere JWT jti a Redis blacklist con TTL

  // auth-validate/handler.ts
  // Verificare JWT jti non in blacklist
  ```

---

## 📋 CHECKLIST FINALE

### ✅ Verifica Completamento

- [ ] **Fase 0: Preparazione**
  - [ ] Azure AD App Registration configurato
  - [ ] Secrets creati in Key Vault
  - [ ] Terraform files aggiornati
  - [ ] Locals rigenerati

- [ ] **Fase 1: Auth Function**
  - [ ] `apps/sm-auth-fn` creato
  - [ ] Tutti gli endpoints implementati
  - [ ] Build locale riuscito
  - [ ] Test locali passati

- [ ] **Fase 2: Frontend**
  - [ ] Dipendenze MSAL rimosse
  - [ ] File obsoleti eliminati
  - [ ] Nuovi API routes creati
  - [ ] Middleware implementato
  - [ ] SessionProvider aggiornato
  - [ ] UI components aggiornati
  - [ ] Test locali passati

- [ ] **Fase 3: Deploy**
  - [ ] Terraform plan verificato
  - [ ] Infra deployed
  - [ ] Auth Function deployed
  - [ ] Frontend deployed (staging + production)
  - [ ] Test end-to-end passati

### 🎉 Sign-Off

- [ ] **Product Owner approval**
- [ ] **Tech Lead approval**
- [ ] **Security review completed**
- [ ] **Documentation updated**
- [ ] **Runbook created** (per troubleshooting)

---

## 🚨 ROLLBACK PLAN

In caso di problemi critici in produzione:

### Quick Rollback

1. **Swap slot production ↔ staging**

   ```bash
   az webapp deployment slot swap \
     --name plsm-p-itn-fe-smcr-app-01 \
     --resource-group plsm-p-itn-sm-rg-01 \
     --slot staging
   ```

2. **Revert Terraform changes**

   ```bash
   cd infra/resources/prod
   git checkout HEAD~1 -- prod.yaml locals_yaml.tf data.tf
   terraform apply
   ```

3. **Restore old MSAL config** (se necessario)
   - Ripristinare `NEXT_PUBLIC_MSAL_*` env vars
   - Ripristinare codice MSAL client-side da git history

### Gradual Rollback

1. **Feature flag** (se implementato):
   - Disabilitare nuovo auth system
   - Fallback a vecchio MSAL client

2. **Canary release**:
   - Redirigere solo % traffico a nuovo sistema
   - Monitorare errori
   - Aumentare % gradualmente

---

## 📞 SUPPORTO & CONTATTI

- **Azure AD Admin**: **************\_**************
- **Key Vault Admin**: **************\_**************
- **On-call Engineer**: **************\_**************
- **Slack Channel**: `#plsm-auth-migration`

---

## 📅 TIMELINE SUGGERITA

| Fase                   | Durata Stimata | Responsabile  |
| ---------------------- | -------------- | ------------- |
| Fase 0: Preparazione   | 2-3 ore        | DevOps + Dev  |
| Fase 1: Auth Function  | 1 giorno       | Backend Dev   |
| Fase 2: Frontend       | 1 giorno       | Frontend Dev  |
| Fase 3: Deploy         | 4 ore          | DevOps        |
| Fase 4: Security (opt) | 1-2 giorni     | Security Team |
| **TOTALE**             | **3-4 giorni** | Team          |

---

**✅ Checklist creata il:** 2026-03-08  
**👤 Creata da:** Lorenzo Franceschini + AI Assistant  
**📌 Ultima modifica:** 2026-03-08  
**🔗 Issue/Ticket:** SMION-705

---

## 🔍 VERIFICA INFRA - RISULTATI

### ✅ Terraform Auth Function

**File:** `infra/resources/prod/auth_func.tf`

```hcl
module "auth_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "auth",
    instance_number = "01"
  })

  application_insights_connection_string = data.azurerm_key_vault_secret.appinsights_connection_string.value
  application_insights_key               = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value

  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.network_resource_group_name
  }
  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.auth_fa_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.auth_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.auth_slot_func_app_settings)

  depends_on = [module.azure_core_infra]
}
```

**Status:** ✅ **Esistente e configurato**

- Function App: `plsm-p-itn-auth-func-01`
- Resource Group: `plsm-p-itn-fn-rg-01`
- VNet integration: configurata
- Health check: `/api/v1/health` (come da piano!)
- Node version: 22 ✅

### ✅ YAML Config Attuale

**File:** `infra/resources/environments/prod.yaml` (linee 124-127)

```yaml
auth_func:
  __local: yaml_auth_func
  NODE_ENV: "production"
  WEBSITE_RUN_FROM_PACKAGE: "1"
```

**Status:** ⚠️ **Minimale - da arricchire con MSAL e JWT vars**

### ✅ Locals Generati

**File:** `infra/resources/prod/locals_yaml.tf` (linee 137-142)

```hcl
yaml_auth_func_app_settings = {
  NODE_ENV                 = "production"
  WEBSITE_RUN_FROM_PACKAGE = "1"
}

yaml_auth_func_slot_app_settings = local.yaml_auth_func_app_settings
```

**Status:** ⚠️ **Vuoto - verrà popolato dopo aggiornamento YAML**

### 🔍 Secrets MSAL Esistenti

**File:** `infra/resources/prod/data.tf` (linee 59-67)

```hcl
data "azurerm_key_vault_secret" "fe_smcr_plsm_p_platformsm_tenant_id" {
  name         = "fe-smcr-plsm-p-platformsm-tenant-id"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_plsm_p_platformsm_client_id" {
  name         = "fe-smcr-plsm-p-platformsm-client-id"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
```

**Status:** ✅ **Client ID e Tenant ID già in Key Vault**

**Mancano:**

- `auth-msal-client-secret` (nuovo)
- `auth-jwt-secret` (nuovo)

---

## 📊 RIEPILOGO STATO INFRA

| Componente                  | Status         | Note                                     |
| --------------------------- | -------------- | ---------------------------------------- |
| **Terraform Module**        | ✅ Esistente   | `auth_func.tf` configurato               |
| **Function App**            | ✅ Deployed    | `plsm-p-itn-auth-func-01`                |
| **YAML Config**             | ⚠️ Minimale    | Solo NODE_ENV e WEBSITE_RUN_FROM_PACKAGE |
| **Secrets - Client ID**     | ✅ Esistente   | `fe-smcr-plsm-p-platformsm-client-id`    |
| **Secrets - Tenant ID**     | ✅ Esistente   | `fe-smcr-plsm-p-platformsm-tenant-id`    |
| **Secrets - Client Secret** | ❌ Mancante    | Da creare: `auth-msal-client-secret`     |
| **Secrets - JWT Secret**    | ❌ Mancante    | Da creare: `auth-jwt-secret`             |
| **Code - Auth Function**    | ❌ Mancante    | `apps/sm-auth-fn/` non esiste            |
| **VNet Integration**        | ✅ Configurato | Stessa VNet di fe-smcr                   |

---

## 🎯 PROSSIMI STEP IMMEDIATI

1. ✅ **Checklist creata** ← FATTO!
2. ✅ **Infra verificata** ← FATTO!
3. ⏭️ **Fase 0: Preparazione**
   - Creare secrets in Key Vault
   - Aggiornare `data.tf` e `prod.yaml`
   - Rigenerare locals
4. ⏭️ **Fase 1: Implementare Auth Function**

---

**Fine Checklist** 🎉
