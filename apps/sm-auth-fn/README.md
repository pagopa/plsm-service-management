# Auth Function - MSAL Token Validation Service

Authentication service che valida token Azure AD e genera JWT interni per l'applicazione Next.js.

## 🏗️ Architettura

**Approccio: Token Validation**

1. **Frontend (browser)** → Autentica con Azure AD usando MSAL Browser
2. **Browser** → Ottiene Access Token JWT da Azure AD
3. **Auth Function** → Valida token usando chiavi pubbliche Azure AD (JWKS)
4. **Auth Function** → Genera JWT interno firmato con `JWT_SECRET`
5. **Next.js** → Valida JWT su ogni richiesta tramite middleware

### Vantaggi

- ✅ **Nessun Client Secret/Certificate** necessario (conforme policy aziendali)
- ✅ **Validazione stateless** usando chiavi pubbliche
- ✅ **Nessuna chiamata a Microsoft Graph API**
- ✅ **HttpOnly cookies** invece di localStorage (più sicuro)
- ✅ **Server-side route protection** con Next.js middleware

## 📁 Struttura

```
apps/sm-auth-fn/
├── _shared/              # Moduli condivisi
│   ├── types/           # TypeScript types
│   │   └── index.ts     # Interfaces per payload, config, responses
│   └── utils/           # Utility functions
│       ├── config.ts    # Caricamento configurazione
│       ├── tokenValidator.ts  # Validazione token Azure AD
│       └── jwtUtils.ts  # Generazione/validazione JWT interni
│
├── health/              # Endpoint: GET /api/v1/health
│   ├── index.ts        # Route configuration
│   └── handler.ts      # Health check logic
│
├── auth-validate/       # Endpoint: POST /api/v1/auth/validate
│   ├── index.ts        # Route configuration
│   └── handler.ts      # Token validation + JWT generation
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
    "JWT_SECRET": "your-32-char-secret-here-change-me",
    "JWT_EXPIRY_SECONDS": "3600",
    "JWT_ISSUER": "plsm-auth-service",
    "JWT_AUDIENCE": "plsm-fe-smcr"
  }
}
```

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
    "jwtSecretConfigured": true
  }
}
```

---

### 2. Validate Token

**Endpoint:** `POST /api/v1/auth/validate`  
**Auth:** Anonymous  
**Descrizione:** Valida token Azure AD e genera JWT interno.

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
  "message": "Authentication successful",
  "user": {
    "userId": "ea7b9fad-7567-47a9-8f44-ac8bc491cdb0",
    "email": "user@example.com",
    "name": "Mario Rossi",
    "roles": []
  }
}
```

**Headers:**

```
Set-Cookie: auth-token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Token validation failed: invalid signature"
}
```

---

### 3. Refresh Token

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

### 4. Logout

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

| Variabile            | Descrizione                          | Esempio             |
| -------------------- | ------------------------------------ | ------------------- |
| `MSAL_CLIENT_ID`     | Azure AD App Registration Client ID  | `f3cd68c1-...`      |
| `MSAL_TENANT_ID`     | Azure AD Tenant ID                   | `7788edaf-...`      |
| `JWT_SECRET`         | Secret per firmare JWT (min 32 char) | `d0b3d3b1e857...`   |
| `JWT_EXPIRY_SECONDS` | Durata JWT in secondi                | `3600` (1 ora)      |
| `JWT_ISSUER`         | Issuer del JWT                       | `plsm-auth-service` |
| `JWT_AUDIENCE`       | Audience del JWT                     | `plsm-fe-smcr`      |

**Secrets in Azure Key Vault:**

- `auth-msal-client-id`
- `auth-msal-tenant-id`
- `auth-jwt-secret`

## 🧪 Testing

### Test Health Check

```bash
curl http://localhost:7071/api/v1/health
```

### Test Token Validation

```bash
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

## 📦 Dipendenze

```json
{
  "@azure/functions": "^4.10.0", // Azure Functions v4 programming model
  "jsonwebtoken": "^9.0.2", // JWT generation/validation
  "jwks-rsa": "^3.1.0" // Azure AD public key fetching
}
```

## 🔒 Sicurezza

### Token Validation Flow

1. **Estrai Key ID (kid)** dall'header del token Azure AD
2. **Scarica chiave pubblica** da `https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys`
3. **Verifica firma** usando algoritmo RS256
4. **Valida claims:** issuer, audience, expiration
5. **Estrai user info:** oid, email, name, roles

### JWT Generation

- **Algoritmo:** HS256 (HMAC SHA-256)
- **Secret:** `JWT_SECRET` (min 32 caratteri)
- **Cookie:** HttpOnly, Secure, SameSite=Strict
- **Claims:** userId, email, name, roles, iss, aud, exp, iat

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

### Error: "Token validation failed: invalid signature"

Il token Azure AD potrebbe essere scaduto o non valido. Verifica che `MSAL_CLIENT_ID` e `MSAL_TENANT_ID` siano corretti.

### Error: "JWT_SECRET must be at least 32 characters long"

Genera un secret più lungo: `openssl rand -hex 32`

### Health check ritorna "unhealthy"

Controlla i log della function per identificare quale configurazione manca.
