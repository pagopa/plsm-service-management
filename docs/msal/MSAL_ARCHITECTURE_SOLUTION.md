# 🔐 Architettura Auth MSAL - Token Validation Approach

## ❓ Problema Iniziale

Come configurare l'Auth Function per autenticare utenti con Azure AD **senza usare Client Secret o Certificate** (policy aziendale: solo autenticazione federata)?

---

## 🎯 Soluzione: Token Validation Architecture

### **Architettura Scelta: Client-Side Login + Server-Side Validation**

```
┌─────────┐                    ┌──────────────┐                  ┌─────────────┐
│ Browser │◄──────────────────►│  Azure AD    │                  │ Auth Func   │
└─────────┘   Direct MSAL      └──────────────┘                  └─────────────┘
     │         (PublicClient)            │                              │
     │                                   │                              │
     │  1. Login via Azure AD            │                              │
     ├──────────────────────────────────►│                              │
     │    (MSAL @azure/msal-browser)     │                              │
     │                                   │                              │
     │  2. Get Access Token (JWT)        │                              │
     │◄──────────────────────────────────┤                              │
     │                                   │                              │
     │  3. Send Token for Validation     │                              │
     ├───────────────────────────────────┼─────────────────────────────►│
     │                                   │  - Verify JWT signature      │
     │                                   │  - Check issuer, audience    │
     │                                   │  - Validate expiry           │
     │                                   │  - Extract user claims       │
     │                                   │                              │
     │  4. Receive Internal JWT          │                              │
     │◄──────────────────────────────────┼──────────────────────────────┤
     │    (HttpOnly Cookie)              │                              │
     │                                   │                              │
     │  5. Subsequent Requests           │                              │
     ├───────────────────────────────────┼─────────────────────────────►│
     │    (JWT Cookie validated)         │                              │
```

---

## ✅ Vantaggi di Questo Approccio

1. ✅ **Nessun Client Secret necessario** - Conforme alla policy aziendale
2. ✅ **Nessun Certificate necessario** - Semplifica la gestione
3. ✅ **Azure AD gestisce login** - Sicurezza garantita da Microsoft
4. ✅ **Stateless validation** - Verifica JWT senza chiamate a Azure AD
5. ✅ **HttpOnly Cookies** - Token sicuri non accessibili da JavaScript
6. ✅ **Managed Identity** - Per accesso Key Vault (JWT secret)

---

## 🔍 Come Funziona

### **1️⃣ Frontend (Browser)**

Il frontend usa **MSAL Browser** (PublicClientApplication) per:

- Login utente con Azure AD
- Ottenere Access Token JWT
- Inviare token all'Auth Function per validazione

**NON serve Client Secret** perché è un'app pubblica!

### **2️⃣ Auth Function**

La Function App:

1. **Riceve** l'Access Token dal frontend
2. **Valida** il JWT:
   - Verifica firma (usando Azure AD public keys)
   - Controlla `issuer` (`https://login.microsoftonline.com/{tenant-id}/v2.0`)
   - Controlla `audience` (deve essere il Client ID dell'app)
   - Verifica scadenza (`exp` claim)
3. **Estrae** claims utente (email, nome, ruoli, ecc.)
4. **Genera** un JWT interno firmato con `JWT_SECRET`
5. **Restituisce** il JWT come HttpOnly Cookie

### **3️⃣ Next.js Middleware**

Per ogni richiesta:

1. Legge il JWT cookie
2. Verifica firma con `JWT_SECRET`
3. Se valido → passa al route handler
4. Se invalido/scaduto → redirect a `/auth/login`

---

## 📝 Configurazione Terraform

### **1. data.tf** (Aggiornato)

```hcl
# Auth Function Secrets
# NOTE: Using Token Validation (no Client Secret/Certificate needed)

data "azurerm_key_vault_secret" "auth_msal_client_id" {
  name         = "auth-msal-client-id"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "auth_msal_tenant_id" {
  name         = "auth-msal-tenant-id"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "auth_jwt_secret" {
  name         = "auth-jwt-secret"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
```

**❌ NON servono:**

- `auth_msal_client_secret`
- `auth_msal_cert_thumbprint`
- `auth_msal_cert_private_key`

### **2. prod.yaml** (Aggiornato)

```yaml
auth_func:
  __local: yaml_auth_func
  NODE_ENV: "production"
  WEBSITE_RUN_FROM_PACKAGE: "1"
  # MSAL Configuration (Token Validation only)
  MSAL_CLIENT_ID: "kv:auth_msal_client_id"
  MSAL_TENANT_ID: "kv:auth_msal_tenant_id"
  # JWT Configuration
  JWT_SECRET: "kv:auth_jwt_secret"
  JWT_EXPIRY_SECONDS: "3600"
  JWT_ISSUER: "plsm-auth-service"
  JWT_AUDIENCE: "plsm-fe-smcr"
```

**❌ NON servono:**

- `MSAL_CLIENT_SECRET`
- `MSAL_CERT_THUMBPRINT`
- `MSAL_CERT_PRIVATE_KEY`
- `MSAL_REDIRECT_URI` (gestito dal frontend)

### **3. auth_func.tf**

```hcl
# Grant Managed Identity access to Key Vault (for JWT_SECRET)
resource "azurerm_role_assignment" "auth_func_keyvault_reader" {
  scope                = module.azure_core_infra.common_key_vault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.auth_function.function_app_principal_id
}
```

---

## 🔑 Secrets Necessari in Key Vault

### **✅ Da Creare:**

```bash
# 1. auth-msal-client-id (già creato ✅)
az keyvault secret set \
  --vault-name plsm-p-itn-common-kv-01 \
  --name auth-msal-client-id \
  --value "f3cd68c1-4b55-4aa0-b655-335020ac1606"

# 2. auth-msal-tenant-id (già creato ✅)
az keyvault secret set \
  --vault-name plsm-p-itn-common-kv-01 \
  --name auth-msal-tenant-id \
  --value "7788edaf-0346-4068-9d79-c868aed15b3d"

# 3. auth-jwt-secret (già creato ✅)
az keyvault secret set \
  --vault-name plsm-p-itn-common-kv-01 \
  --name auth-jwt-secret \
  --value "d0b3d3b1e8573f192bd94b04a52ac18c9bca0cc80b91c5b76ba92b4af32b2a74"
```

### **❌ Da Eliminare (NON più necessari):**

```bash
# Questi secrets NON servono più con Token Validation approach:
az keyvault secret delete \
  --vault-name plsm-p-itn-common-kv-01 \
  --name auth-msal-client-secret

# Se esistono altri secrets di test, eliminarli:
# - auth-msal-cert-thumbprint
# - auth-msal-cert-private-key
```

---

## 🎭 Implementazione MSAL (Token Validation)

### **Frontend: MSAL Browser (Esistente)**

```typescript
// apps/sm-fe-smcr/lib/msalConfig.ts
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MSAL_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

### **Auth Function: Token Validation**

```typescript
// apps/sm-auth-fn/_shared/tokenValidator.ts
import { JwksClient } from "jwks-rsa";
import jwt from "jsonwebtoken";

const jwksClient = new JwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.MSAL_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

export async function validateAzureADToken(token: string) {
  // 1. Decode token header to get 'kid' (key ID)
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header.kid) {
    throw new Error("Invalid token: missing kid");
  }

  // 2. Get signing key from Azure AD
  const key = await jwksClient.getSigningKey(decoded.header.kid);
  const signingKey = key.getPublicKey();

  // 3. Verify token signature and claims
  const verified = jwt.verify(token, signingKey, {
    audience: process.env.MSAL_CLIENT_ID,
    issuer: `https://login.microsoftonline.com/${process.env.MSAL_TENANT_ID}/v2.0`,
    algorithms: ["RS256"],
  }) as any;

  // 4. Return user claims
  return {
    userId: verified.oid || verified.sub,
    email: verified.email || verified.preferred_username,
    name: verified.name,
    roles: verified.roles || [],
  };
}
```

### **Auth Function: Endpoint `/auth/validate`**

```typescript
// apps/sm-auth-fn/auth-validate/index.ts
import { validateAzureADToken } from "../_shared/tokenValidator";
import { generateInternalJWT } from "../_shared/jwtUtils";

export default async function handler(req: any, context: any) {
  try {
    // 1. Get Azure AD token from request
    const azureToken = req.headers.authorization?.replace("Bearer ", "");
    if (!azureToken) {
      return { status: 401, body: { error: "Missing token" } };
    }

    // 2. Validate Azure AD token
    const userClaims = await validateAzureADToken(azureToken);

    // 3. Generate internal JWT
    const internalJWT = generateInternalJWT(userClaims);

    // 4. Return JWT (Next.js will set as HttpOnly cookie)
    return {
      status: 200,
      body: {
        success: true,
        token: internalJWT,
        user: userClaims,
      },
    };
  } catch (error) {
    context.log.error("Token validation failed:", error);
    return { status: 401, body: { error: "Invalid token" } };
  }
}
```

---

## 📊 Comparison: Architecture Options

| Aspetto                 | Token Validation ✅       | Client Secret ❌       | Certificate ❌              |
| ----------------------- | ------------------------- | ---------------------- | --------------------------- |
| **Client Secret/Cert**  | ❌ NON necessario         | ✅ Serve Client Secret | ✅ Serve Certificate        |
| **Policy Compliance**   | ✅ Conforme               | ❌ Non conforme        | ❌ Non conforme (complesso) |
| **Complexity**          | ⭐⭐ Medio                | ⭐ Semplice            | ⭐⭐⭐ Complesso            |
| **Security**            | ✅ Alta                   | ⭐⭐ Media             | ✅ Alta                     |
| **Secret Rotation**     | ❌ Non necessario         | 🔄 Ogni 12-24 mesi     | 🔄 Auto-renewal possibile   |
| **Azure AD Dependency** | ✅ Solo per public keys   | ✅ Per token exchange  | ✅ Per token exchange       |
| **Frontend Changes**    | ⭐ Minimal (già usa MSAL) | ⭐⭐ Moderate          | ⭐⭐ Moderate               |

---

## ✅ Summary

| Componente                         | Metodo Auth                | Scopo                                |
| ---------------------------------- | -------------------------- | ------------------------------------ |
| **Browser → Azure AD**             | MSAL PublicClient ✅       | Login utente, ottiene Access Token   |
| **Browser → Auth Function**        | Token Validation ✅        | Valida token, genera JWT interno     |
| **Function App → Azure Resources** | System Managed Identity ✅ | Accesso Key Vault (JWT_SECRET)       |
| **Next.js Middleware**             | JWT Verification ✅        | Valida JWT interno su ogni richiesta |

### **Secrets Necessari:**

- ✅ `auth-msal-client-id` (già creato)
- ✅ `auth-msal-tenant-id` (già creato)
- ✅ `auth-jwt-secret` (già creato)

### **Secrets NON Necessari (da eliminare):**

- ❌ `auth-msal-client-secret`
- ❌ `auth-msal-cert-thumbprint`
- ❌ `auth-msal-cert-private-key`

---

**Fine documento** 🎉
