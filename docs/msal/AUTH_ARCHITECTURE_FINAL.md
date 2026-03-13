# 🎯 Architettura Finale: Auth as a Service (Token Validation)

**Data:** 2026-03-08  
**Status:** ✅ **CONFIGURAZIONE TERRAFORM COMPLETATA**

---

## 📊 Riepilogo Decisioni Architetturali

### ❌ Opzioni Scartate

1. **Client Secret Approach**
   - ❌ Viola policy aziendale (no client secrets)
   - Richiede: `auth-msal-client-secret` in Key Vault

2. **Certificate-Based Auth**
   - ❌ Troppo complesso per il caso d'uso
   - Richiede: certificati, thumbprint, private key

### ✅ Soluzione Scelta: **Token Validation**

- ✅ **Conforme** alla policy aziendale (no secrets/certificates)
- ✅ **Semplice** da implementare
- ✅ **Sicuro** (validazione JWT con Azure AD public keys)
- ✅ **Stateless** (no chiamate ad Azure AD per validazione)

---

## 🏗️ Architettura Implementata

```
┌─────────────┐           ┌──────────────┐           ┌─────────────┐
│   Browser   │           │  Azure AD    │           │ Auth Func   │
│  (Next.js)  │           │              │           │  (Azure)    │
└─────────────┘           └──────────────┘           └─────────────┘
      │                           │                          │
      │ 1. Login (MSAL Browser)   │                          │
      ├──────────────────────────►│                          │
      │                           │                          │
      │ 2. Access Token (JWT)     │                          │
      │◄──────────────────────────┤                          │
      │                           │                          │
      │ 3. Validate Token         │                          │
      ├──────────────────────────────────────────────────────►│
      │                           │   - Verify JWT signature │
      │                           │   - Check claims         │
      │                           │   - Extract user info    │
      │                           │                          │
      │ 4. Internal JWT (HttpOnly Cookie)                    │
      │◄─────────────────────────────────────────────────────┤
      │                           │                          │
      │ 5. API Requests (with JWT cookie)                    │
      ├──────────────────────────────────────────────────────►│
      │                           │   Next.js Middleware     │
      │                           │   validates JWT          │
```

---

## ✅ Configurazione Terraform Completata

### **1. Secrets in Key Vault** ✅

| Secret Name           | Status    | Value                                                              | Uso                             |
| --------------------- | --------- | ------------------------------------------------------------------ | ------------------------------- |
| `auth-msal-client-id` | ✅ Creato | `f3cd68c1-4b55-4aa0-b655-335020ac1606`                             | Azure AD App Registration ID    |
| `auth-msal-tenant-id` | ✅ Creato | `7788edaf-0346-4068-9d79-c868aed15b3d`                             | Azure AD Tenant ID              |
| `auth-jwt-secret`     | ✅ Creato | `d0b3d3b1e8573f192bd94b04a52ac18c9bca0cc80b91c5b76ba92b4af32b2a74` | Firma JWT interni (per Next.js) |

**❌ Secrets NON necessari** (mai creati, quindi nulla da eliminare):

- `auth-msal-client-secret` ❌
- `auth-msal-cert-thumbprint` ❌
- `auth-msal-cert-private_key` ❌

### **2. File Terraform Aggiornati** ✅

#### `infra/resources/prod/data.tf`

```hcl
# Auth Function Secrets
# NOTE: Using Token Validation approach (no Client Secret/Certificate needed)
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

#### `infra/resources/environments/prod.yaml`

```yaml
auth_func:
  __local: yaml_auth_func
  NODE_ENV: "production"
  WEBSITE_RUN_FROM_PACKAGE: "1"
  # MSAL Configuration (Token Validation - no Client Secret needed)
  MSAL_CLIENT_ID: "kv:auth_msal_client_id"
  MSAL_TENANT_ID: "kv:auth_msal_tenant_id"
  # JWT Configuration
  JWT_SECRET: "kv:auth_jwt_secret"
  JWT_EXPIRY_SECONDS: "3600"
  JWT_ISSUER: "plsm-auth-service"
  JWT_AUDIENCE: "plsm-fe-smcr"
```

#### `infra/resources/prod/locals_yaml.tf` (Auto-generato) ✅

```hcl
yaml_auth_func_app_settings = {
  NODE_ENV                 = "production"
  WEBSITE_RUN_FROM_PACKAGE = "1"
  MSAL_CLIENT_ID           = data.azurerm_key_vault_secret.auth_msal_client_id.value
  MSAL_TENANT_ID           = data.azurerm_key_vault_secret.auth_msal_tenant_id.value
  JWT_SECRET               = data.azurerm_key_vault_secret.auth_jwt_secret.value
  JWT_EXPIRY_SECONDS       = "3600"
  JWT_ISSUER               = "plsm-auth-service"
  JWT_AUDIENCE             = "plsm-fe-smcr"
}
```

---

## 📝 Prossimi Step

### **Phase 0: Infrastructure** ✅ **COMPLETATO**

- [x] Secrets creati in Key Vault
- [x] Terraform configurato (`data.tf`, `prod.yaml`, `locals_yaml.tf`)
- [x] Managed Identity configurata per Key Vault access
- [ ] **TODO:** Run `terraform plan` per verificare configurazione
- [ ] **TODO:** Run `terraform apply` per applicare modifiche

### **Phase 1: Auth Function Code** 🚧 **PROSSIMO**

Creare il codice dell'Auth Function:

1. **Struttura progetto**: `apps/sm-auth-fn/`
2. **Endpoints da implementare**:
   - `/auth/validate` - Valida Azure AD token, genera JWT interno
   - `/auth/refresh` - Rinnova JWT se valido
   - `/auth/logout` - Invalida JWT
   - `/api/v1/health` - Health check
3. **Shared modules**:
   - `tokenValidator.ts` - Valida Azure AD JWT
   - `jwtUtils.ts` - Genera/valida JWT interni
   - `msalConfig.ts` - Configurazione MSAL (solo per metadata)

### **Phase 2: Frontend Migration** 🚧

Modificare `apps/sm-fe-smcr/`:

1. **Mantenere** MSAL Browser per login
2. **Aggiungere** chiamata a `/auth/validate` dopo login
3. **Modificare** middleware per validare JWT cookie
4. **Rimuovere** logica client-side MSAL dopo completamento

### **Phase 3: Deploy & Test** 🚧

1. Deploy Auth Function
2. Test integration
3. Rollout graduale (staging → production)

---

## 🔑 Comandi Utili

### **Verificare Secrets in Key Vault**

```bash
az keyvault secret list \
  --vault-name plsm-p-itn-common-kv-01 \
  --query "[?starts_with(name, 'auth-')].[name, attributes.created]" \
  -o table
```

### **Rigenerare Locals Terraform**

```bash
python3 infra/scripts/generate_locals.py
```

### **Terraform Plan/Apply**

```bash
cd infra/resources/prod
terraform init
terraform plan   # Verifica modifiche
terraform apply  # Applica modifiche
```

### **Verificare Function App Settings**

```bash
az functionapp config appsettings list \
  --name plsm-p-itn-auth-func-01 \
  --resource-group plsm-p-itn-fn-rg-01 \
  --query "[?starts_with(name, 'MSAL_') || starts_with(name, 'JWT_')]" \
  -o table
```

---

## 📚 Documentazione

- **Architettura dettagliata**: `MSAL_ARCHITECTURE_SOLUTION.md`
- **Migration checklist completa**: `AUTH_MIGRATION_CHECKLIST.md` (da aggiornare)
- **Questo documento**: `AUTH_ARCHITECTURE_FINAL.md`

---

## ✅ Checklist Finale

### Infrastructure (Phase 0)

- [x] Secrets creati in Key Vault (3/3)
- [x] `data.tf` aggiornato
- [x] `prod.yaml` aggiornato
- [x] `locals_yaml.tf` rigenerato
- [ ] Terraform plan eseguito
- [ ] Terraform apply eseguito

### Code (Phase 1) - DA FARE

- [ ] Auth Function creata (`apps/sm-auth-fn/`)
- [ ] Endpoint `/auth/validate` implementato
- [ ] Token validation con Azure AD public keys
- [ ] JWT generation/validation
- [ ] Health check endpoint

### Frontend (Phase 2) - DA FARE

- [ ] Auth client per chiamare Auth Function
- [ ] Middleware aggiornato per JWT validation
- [ ] Login flow integrato con Auth Function
- [ ] Rimozione logica MSAL client-side

### Deploy (Phase 3) - DA FARE

- [ ] Deploy Auth Function su staging
- [ ] Test integration staging
- [ ] Deploy production
- [ ] Monitoring e logging

---

## 🎯 Vantaggi dell'Architettura Finale

| Aspetto               | Before (Client-Side MSAL) | After (Token Validation) |
| --------------------- | ------------------------- | ------------------------ |
| **Token Storage**     | ❌ localStorage           | ✅ HttpOnly Cookie       |
| **Client Secrets**    | ❌ Esposti nel browser    | ✅ Mai esposti           |
| **Security**          | ⭐⭐ Media                | ✅ Alta                  |
| **Policy Compliance** | ⚠️ Parziale               | ✅ Totale                |
| **Centralized Auth**  | ❌ No                     | ✅ Sì                    |
| **Route Protection**  | ⭐ Client-side only       | ✅ Server-side           |
| **Audit & Logging**   | ❌ Limitato               | ✅ Centralizzato         |

---

**Fine documento** 🎉

**Prossima azione:** Eseguire `terraform plan` per verificare la configurazione.
