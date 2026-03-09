# Auth Function - Server-Side MSAL Authentication Service

Authentication service che gestisce autenticazione Azure AD con **Public Client + PKCE flow** e genera JWT interni per l'applicazione Next.js.

## 🏗️ Architettura

**Approccio: Server-Side MSAL Public Client Flow con PKCE**

1. **Browser** → Redirect a `/auth/login` endpoint
2. **Auth Function** → Genera PKCE challenge e redirect ad Azure AD
3. **Azure AD** → User completa login e ritorna authorization code
4. **Auth Function** → Scambia code per token usando PKCE verifier (**NO CLIENT SECRET!**)
5. **Auth Function** → Genera JWT interno firmato con `JWT_SECRET`
6. **Next.js** → Valida JWT su ogni richiesta tramite middleware

### Vantaggi

- ✅ **Nessun Client Secret/Certificate necessario** - Public Client Authentication
- ✅ **PKCE (Proof Key for Code Exchange)** - Sicurezza per Public Clients
- ✅ **Frontend completamente agnostico** - Nessuna dipendenza MSAL nel browser
- ✅ **HttpOnly cookies** invece di localStorage (più sicuro)
- ✅ **Server-side route protection** con Next.js middleware
- ✅ **Flusso OAuth2 standard** - Authorization Code Flow

### 🔄 Cambiamento Architetturale

**Vecchia implementazione (DEPRECATED):**

- ❌ Token Validation con `jwks-rsa`
- ❌ Frontend gestiva MSAL Browser
- ❌ `/auth/validate` endpoint

**Nuova implementazione:**

- ✅ Server-Side MSAL con `@azure/msal-node`
- ✅ Public Client + PKCE
- ✅ `/auth/login` e `/auth/callback` endpoints

## 📁 Struttura

```
apps/sm-auth-fn/
├── _shared/              # Moduli condivisi
│   ├── types/           # TypeScript types
│   │   └── index.ts     # Interfaces per payload, config, responses
│   └── utils/           # Utility functions
│       ├── config.ts    # Caricamento configurazione
│       ├── msalClient.ts     # ✅ NUOVO: MSAL Public Client (PKCE)
│       └── jwtUtils.ts       # Generazione/validazione JWT interni
│       # ❌ RIMOSSO: tokenValidator.ts (jwks-rsa)
│
├── health/              # Endpoint: GET /api/v1/health
│   ├── index.ts        # Route configuration
│   └── handler.ts      # Health check logic
│
├── auth-login/          # ✅ NUOVO: Endpoint: GET /api/v1/auth/login
│   ├── index.ts        # Route configuration
│   └── handler.ts      # Initiate PKCE flow + redirect to Azure AD
│
├── auth-callback/       # ✅ NUOVO: Endpoint: GET /api/v1/auth/callback
│   ├── index.ts        # Route configuration
│   └── handler.ts      # Handle Azure AD callback + token exchange
│
├── auth-validate/       # ⚠️ DEPRECATED: Endpoint: POST /api/v1/auth/validate
│   ├── index.ts        # Route configuration
│   └── handler.ts      # (Mantenuto per backward compatibility)
│
├── auth-refresh/        # Endpoint: POST /api/v1/auth/refresh
│   ├── index.ts        # Route configuration
│   └── handler.ts      # JWT refresh logic
│
├── auth-logout/         # Endpoint: POST /api/v1/auth/logout
│   ├── index.ts        # Route configuration
│   └── handler.ts      # Logout logic (clear cookie)
│
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── host.json            # Azure Functions configuration
└── local.settings.json  # Environment variables (local)
```

## 🚀 Setup Locale

### 1. Installa dipendenze

```bash
cd apps/sm-auth-fn
yarn install
```

### 2. Configura `local.settings.json`

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",

    "MSAL_CLIENT_ID": "f3cd68c1-4b55-4aa0-b655-335020ac1606",
    "MSAL_TENANT_ID": "7788edaf-0346-4068-9d79-c868aed15b3d",
    "MSAL_REDIRECT_URI": "http://localhost:7071/api/v1/auth/callback",

    "JWT_SECRET": "your-32-char-secret-here-change-me",
    "JWT_EXPIRY_SECONDS": "3600",
    "JWT_ISSUER": "plsm-auth-service",
    "JWT_AUDIENCE": "plsm-fe-smcr",

    "FRONTEND_URL": "http://localhost:3000"
  }
}
```

**⚠️ IMPORTANTE: Nuove variabili richieste**

- `MSAL_REDIRECT_URI` - URL di callback per PKCE flow
- `FRONTEND_URL` - URL frontend per CORS e redirect dopo login

### 3. Build TypeScript

```bash
yarn build
```

### 4. Avvia Azure Functions

```bash
yarn start
```

L'Auth Function sarà disponibile su `http://localhost:7071`.

## 📡 API Endpoints

### 1. Health Check

**Endpoint:** `GET /api/v1/health`  
**Auth:** Anonymous  
**Descrizione:** Verifica stato della function e configurazione.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "message": "Auth Function is running and properly configured",
  "timestamp": "2026-03-08T14:30:00.000Z",
  "config": {
    "jwtIssuer": "plsm-auth-service",
    "jwtAudience": "plsm-fe-smcr",
    "jwtExpirySeconds": 3600,
    "msalTenantConfigured": true,
    "msalClientConfigured": true,
    "msalRedirectUriConfigured": true,
    "jwtSecretConfigured": true
  }
}
```

---

### 2. ✅ Login - Initiate PKCE Flow (NUOVO)

**Endpoint:** `GET /api/v1/auth/login`  
**Auth:** Anonymous  
**Descrizione:** Inizia il flusso PKCE generando code_verifier e redirect ad Azure AD.

**Query Parameters:**

- `returnUrl` (optional) - URL dove redirect dopo login (default: `/dashboard`)

**Request Example:**

```bash
GET /api/v1/auth/login?returnUrl=/dashboard
```

**Response (302 Found):**

```http
HTTP/1.1 302 Found
Location: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?
  client_id={client_id}&
  response_type=code&
  redirect_uri={redirect_uri}&
  scope=openid+profile+email+User.Read&
  code_challenge={code_challenge}&
  code_challenge_method=S256&
  state={random_state}

Set-Cookie: pkce_verifier={verifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600
Set-Cookie: auth_state={state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600
Set-Cookie: return_url={url}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600
```

**Flow:**

1. Genera random `code_verifier` (43-128 chars)
2. Calcola `code_challenge` = base64url(SHA256(code_verifier))
3. Salva verifier in cookie temporaneo (10 minuti)
4. Genera `state` per CSRF protection
5. Redirect a Azure AD con challenge

---

### 3. ✅ Callback - Exchange Code for Token (NUOVO)

**Endpoint:** `GET /api/v1/auth/callback`  
**Auth:** Anonymous (ma richiede PKCE cookies)  
**Descrizione:** Gestisce callback da Azure AD, valida PKCE e scambia code per token.

**Query Parameters:**

- `code` (required) - Authorization code da Azure AD
- `state` (required) - State per CSRF validation

**Request Example:**

```bash
GET /api/v1/auth/callback?code=0.AXoA...&state=abc123
Cookie: pkce_verifier=...; auth_state=...; return_url=/dashboard
```

**Response (302 Found - Success):**

```http
HTTP/1.1 302 Found
Location: http://localhost:3000/dashboard

Set-Cookie: auth-token={jwt}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
Set-Cookie: pkce_verifier=; Max-Age=0  # Clear PKCE cookie
Set-Cookie: auth_state=; Max-Age=0     # Clear state cookie
Set-Cookie: return_url=; Max-Age=0     # Clear return URL cookie
```

**Response (400 Bad Request - Validation Failed):**

```json
{
  "success": false,
  "message": "Invalid state parameter - possible CSRF attack"
}
```

**Flow:**

1. Valida `state` contro cookie (CSRF protection)
2. Recupera `pkce_verifier` da cookie
3. Chiama Azure AD token endpoint con code + verifier (NO SECRET!)
4. Azure AD verifica: SHA256(verifier) = challenge originale
5. Riceve access_token e id_token
6. Genera JWT interno
7. Clear PKCE cookies
8. Set auth-token cookie
9. Redirect a returnUrl

---

### 4. ⚠️ Validate Token (DEPRECATED)

**Endpoint:** `POST /api/v1/auth/validate`  
**Auth:** Anonymous  
**Descrizione:** **⚠️ DEPRECATED - Usare `/auth/login` flow invece.**

**⚠️ Questo endpoint è mantenuto solo per backward compatibility e verrà rimosso in una futura versione.**

**Request Body:**

```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Authentication successful (DEPRECATED: use /auth/login instead)",
  "user": {
    "userId": "ea7b9fad-7567-47a9-8f44-ac8bc491cdb0",
    "email": "user@example.com",
    "name": "Mario Rossi",
    "roles": []
  }
}
```

---

### 5. Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`  
**Auth:** Cookie required  
**Descrizione:** Estende la sessione generando un nuovo JWT.

**Request Headers:**

```
Cookie: auth-token=<current-jwt>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Headers:**

```
Set-Cookie: auth-token=<new-jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

---

### 6. Logout

**Endpoint:** `POST /api/v1/auth/logout`  
**Auth:** Anonymous  
**Descrizione:** Invalida il JWT cancellando il cookie.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Headers:**

```
Set-Cookie: auth-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

## 🔑 Variabili d'Ambiente (Azure)

Configurate tramite Terraform in `infra/resources/environments/prod.yaml`:

| Variabile            | Descrizione                                     | Esempio                                                                            |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `MSAL_CLIENT_ID`     | Azure AD App Registration Client ID             | `f3cd68c1-4b55-4aa0-b655-335020ac1606`                                             |
| `MSAL_TENANT_ID`     | Azure AD Tenant ID                              | `7788edaf-0346-4068-9d79-c868aed15b3d`                                             |
| `MSAL_REDIRECT_URI`  | ✅ **NUOVO:** Callback URL per PKCE flow        | **DEV:** `https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback`  |
|                      |                                                 | **PROD:** `https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback` |
|                      |                                                 | **Local:** `http://localhost:7071/api/v1/auth/callback`                            |
| `JWT_SECRET`         | Secret per firmare JWT (min 32 char)            | `d0b3d3b1e857a5c2f9d4e6a8b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5` |
| `JWT_EXPIRY_SECONDS` | Durata JWT in secondi                           | `3600` (1 ora)                                                                     |
| `JWT_ISSUER`         | Issuer del JWT                                  | `plsm-auth-service`                                                                |
| `JWT_AUDIENCE`       | Audience del JWT                                | `plsm-fe-smcr`                                                                     |
| `FRONTEND_URL`       | ✅ **NUOVO:** URL frontend per CORS e redirects | **DEV:** `https://plsm-d-itn-fe-smcr.azurewebsites.net`                            |
|                      |                                                 | **PROD:** `https://plsm-p-itn-fe-smcr.azurewebsites.net`                           |
|                      |                                                 | **Local:** `http://localhost:3000`                                                 |

**Secrets in Azure Key Vault:**

- `auth-msal-client-id`
- `auth-msal-tenant-id`
- `auth-jwt-secret`

**⚠️ IMPORTANTE: Configurazione Azure AD App Registration**

Nel Azure Portal, la tua App Registration deve avere:

1. **Platform:** Web Application
2. **Redirect URIs configurati:**
   - `http://localhost:7071/api/v1/auth/callback` (sviluppo locale)
   - `https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback` (DEV)
   - `https://plsm-p-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback` (PROD)
3. **Public client flows:** ABILITATO (sotto Authentication > Advanced settings)
4. **NO Certificate/Secret necessari** - Public Client + PKCE flow

## 🧪 Testing

### Test Health Check

```bash
curl http://localhost:7071/api/v1/health | jq
```

### ✅ Test Login Flow (NUOVO)

```bash
# Test 1: Initiate login (dovrebbe ritornare 302 redirect)
curl -v "http://localhost:7071/api/v1/auth/login?returnUrl=/dashboard"

# Dovresti vedere:
# < HTTP/1.1 302 Found
# < Location: https://login.microsoftonline.com/...
# < Set-Cookie: pkce_verifier=...; HttpOnly
# < Set-Cookie: auth_state=...; HttpOnly
# < Set-Cookie: return_url=/dashboard; HttpOnly
```

```bash
# Test 2: Full flow (use browser per completare login)
open "http://localhost:7071/api/v1/auth/login?returnUrl=/dashboard"

# Completa login in browser, verifica:
# 1. Redirect a Azure AD login page
# 2. Dopo login, callback a /auth/callback
# 3. Cookie 'auth-token' settato
# 4. Redirect finale a /dashboard
```

### ⚠️ Test Token Validation (DEPRECATED)

```bash
# ⚠️ Questo endpoint è DEPRECATED, usa /auth/login invece
curl -X POST http://localhost:7071/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "your-azure-ad-token-here"}'
```

### Test Token Refresh

```bash
curl -X POST http://localhost:7071/api/v1/auth/refresh \
  -H "Cookie: auth-token=your-jwt-here"
```

### Test Logout

```bash
curl -X POST http://localhost:7071/api/v1/auth/logout
```

### Test PKCE Flow Manualmente

```bash
# 1. Generate code_verifier e code_challenge localmente
node -e "
const crypto = require('crypto');
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
console.log('Verifier:', verifier);
console.log('Challenge:', challenge);
"

# 2. Costruisci URL Azure AD manualmente con challenge
# 3. Dopo callback, usa verifier per token exchange
```

## 📦 Dipendenze

```json
{
  "@azure/functions": "^4.10.0", // Azure Functions v4 programming model
  "@azure/msal-node": "^2.16.0", // ✅ NUOVO: MSAL Public Client per PKCE flow
  "jsonwebtoken": "^9.0.2" // JWT generation/validation

  // ❌ RIMOSSO: "jwks-rsa": "^3.1.0" (non più necessario)
}
```

### Perché @azure/msal-node?

**@azure/msal-node** permette di implementare **Public Client Authentication** con **PKCE (Proof Key for Code Exchange)**:

- ✅ **Nessun Client Secret** necessario
- ✅ **PKCE Flow** per sicurezza Public Clients
- ✅ **Authorization Code Flow** standard OAuth2
- ✅ **Token acquisition** server-side
- ✅ **Refresh token management** (opzionale)

**Vecchia implementazione (jwks-rsa):**

- ❌ Validava solo token già acquisiti dal frontend
- ❌ Frontend gestiva MSAL Browser
- ❌ Duplicazione logica auth tra frontend/backend

**Nuova implementazione (@azure/msal-node):**

- ✅ Backend gestisce tutto il flusso OAuth2
- ✅ Frontend completamente agnostico (solo redirect)
- ✅ Public Client conforme a best practices OAuth2

## 🔒 Sicurezza

### PKCE Flow (Proof Key for Code Exchange)

PKCE è uno standard OAuth2 (RFC 7636) che protegge Public Clients da authorization code interception attacks.

**Flow dettagliato:**

1. **Generate Code Verifier + Challenge (login endpoint)**

   ```typescript
   const codeVerifier = crypto.randomBytes(32).toString("base64url"); // 43-128 chars
   const codeChallenge = crypto
     .createHash("sha256")
     .update(codeVerifier)
     .digest("base64url");
   ```

2. **Store Verifier in Temporary Cookie**

   ```typescript
   // Cookie: pkce_verifier (HttpOnly, 10 min expiry)
   Set-Cookie: pkce_verifier={verifier}; HttpOnly; Secure; SameSite=Lax; Max-Age=600
   ```

3. **Redirect to Azure AD with Challenge**

   ```
   https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?
     response_type=code&
     client_id={client_id}&
     redirect_uri={redirect_uri}&
     scope=openid profile email User.Read&
     code_challenge={challenge}&
     code_challenge_method=S256&
     state={random_state}
   ```

4. **Azure AD Returns Authorization Code**

   ```
   {redirect_uri}?code={authorization_code}&state={state}
   ```

5. **Exchange Code for Token with Verifier (callback endpoint)**

   ```typescript
   // NO CLIENT SECRET REQUIRED!
   const tokenResponse = await msalClient.acquireTokenByCode({
     code: authorizationCode,
     scopes: ["openid", "profile", "email", "User.Read"],
     codeVerifier: codeVerifier, // From cookie
   });
   ```

6. **Azure AD Validates PKCE**
   ```
   Azure AD verifica: SHA256(code_verifier) === code_challenge
   Se match: ritorna access_token
   Se NO match: 400 Bad Request
   ```

### Perché PKCE?

**Senza PKCE (vulnerabile):**

```
Attacker intercetta authorization code nel redirect
→ Attacker usa code per ottenere token (NO verification!)
→ Account compromesso ❌
```

**Con PKCE (sicuro):**

```
Attacker intercetta authorization code
→ Attacker tenta token exchange SENZA code_verifier
→ Azure AD verifica fallisce (no matching challenge)
→ Token exchange rejected ✅
```

### JWT Generation

- **Algoritmo:** HS256 (HMAC SHA-256)
- **Secret:** `JWT_SECRET` (min 32 caratteri)
- **Cookie:** HttpOnly, Secure, SameSite=Strict
- **Claims:** userId, email, name, roles, iss, aud, exp, iat

### Cookie Security

```typescript
// PKCE cookies (temporary, 10 minutes)
Set-Cookie: pkce_verifier=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600
Set-Cookie: auth_state=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600

// Auth token (persistent, 1 hour)
Set-Cookie: auth-token=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

- **HttpOnly**: Protects against XSS (JavaScript cannot read)
- **Secure**: HTTPS only (no clear text transmission)
- **SameSite=Strict**: Protects against CSRF attacks
- **Path=/**: Available to all routes
- **Max-Age**: Automatic expiry

## 📚 Documentazione Correlata

- `docs/msal/MSAL_ARCHITECTURE_SOLUTION.md` - Architettura completa
- `docs/msal/AUTH_ARCHITECTURE_FINAL.md` - Configurazione finale
- `docs/msal/AUTH_MIGRATION_CHECKLIST.md` - Checklist migrazione

## 🚀 Deploy

Il deploy avviene automaticamente tramite GitHub Actions quando:

1. Si fa push sul branch `main`
2. La pipeline esegue build TypeScript
3. Il codice viene deployato su `plsm-p-itn-auth-func-01`

**Slot:**

- **Production:** `plsm-p-itn-auth-func-01`
- **Staging:** `plsm-p-itn-auth-func-01/slots/staging`

## 🐛 Troubleshooting

### Error: "Missing required environment variables"

Verifica che tutte le variabili siano configurate in `local.settings.json` (locale) o in Azure App Settings (produzione).

**Nuove variabili richieste:**

- `MSAL_REDIRECT_URI` ✅
- `FRONTEND_URL` ✅

### Error: "Invalid redirect URI" da Azure AD

**Causa**: Redirect URI non configurato in Azure AD App Registration  
**Soluzione**:

- Vai su Azure Portal → App Registrations → tua app → Authentication
- Aggiungi Redirect URI: `https://your-function.azurewebsites.net/api/v1/auth/callback`
- Verifica che `MSAL_REDIRECT_URI` nella Function App corrisponda esattamente

### Error: "PKCE verification failed" durante token exchange

**Causa**: Code verifier mancante o non corrispondente al challenge  
**Soluzione**:

- Verifica che cookie `pkce_verifier` sia presente durante callback
- Controlla che cookies non siano bloccati dal browser
- In locale, usa `http://localhost` (NON `127.0.0.1`)
- Verifica che cookie Path e Domain siano corretti

### Error: "Invalid state parameter"

**Causa**: CSRF validation fallita, cookie `auth_state` mancante o alterato  
**Soluzione**:

- Verifica che cookies siano abilitati nel browser
- Controlla logs per vedere se state viene generato correttamente
- Assicurati che non ci siano proxy che rimuovono cookies
- Verifica che SameSite=Lax sia supportato

### Error: "JWT_SECRET must be at least 32 characters long"

Genera un secret più lungo:

```bash
openssl rand -hex 32
```

### Error: "Public client application cannot use client secret"

**Causa**: Azure AD App Registration configurata come Confidential Client  
**Soluzione**:

- Vai su Azure Portal → App Registrations → tua app
- Authentication → Advanced settings
- **Abilita** "Allow public client flows"
- **Rimuovi** eventuali Client Secrets (non necessari con PKCE)

### Health check ritorna "unhealthy"

Controlla i log della function per identificare quale configurazione manca.

Verifica specificamente:

```json
{
  "msalRedirectUriConfigured": true, // ← Nuova verifica
  "frontendUrlConfigured": true // ← Nuova verifica
}
```

### ⚠️ DEPRECATED: Error con /auth/validate

**Causa**: Stai usando vecchio endpoint deprecato  
**Soluzione**:

- Usa il nuovo flow: redirect a `/auth/login`
- Aggiorna frontend per NON chiamare `/auth/validate`
- L'endpoint è mantenuto solo per backward compatibility

### Cookies non vengono settati in produzione

**Causa**: Domain mismatch o CORS issues  
**Soluzione**:

- Verifica che `FRONTEND_URL` sia configurato correttamente
- Controlla CORS settings nella Function App
- In produzione, assicurati che Domain dei cookies corrisponda
- Verifica che `Secure` flag sia usato solo su HTTPS
