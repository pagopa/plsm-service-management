# Setup Auth Function - Ambiente DEV

**Data**: 8 Marzo 2026  
**Branch**: `smion-681-infra-azurefunction-msal`  
**Stato**: 🔴 DA COMPLETARE dopo merge di `infra/dev-sub-min-resources`

---

## Prerequisiti

Prima di procedere con il setup DEV dell'Auth Function, è necessario:

1. ✅ Branch `infra/dev-sub-min-resources` mergiato in `main`
2. ✅ Infrastruttura base DEV già deployata
3. ✅ Key Vault DEV esistente e configurato
4. ✅ Network DEV (VNet, subnets) già configurata

---

## Passi per Aggiungere Auth Function in DEV

### 1. Creare Secrets in Azure Key Vault (DEV)

Creare i seguenti secrets nel Key Vault dell'ambiente DEV usando la GitHub Action o manualmente:

```bash
# Via GitHub Action (workflow: kv-set-secret.yaml)
# Trigger manualmente con questi parametri:

1. auth-msal-client-id-dev
   Value: <Azure AD App Registration Client ID per DEV>

2. auth-msal-tenant-id-dev
   Value: 7788edaf-0346-4068-9d79-c868aed15b3d

3. auth-jwt-secret-dev
   Value: <Generare con: openssl rand -hex 32>
```

**Note:**

- I client ID potrebbero essere diversi tra PROD e DEV se usi Azure AD App Registration separate
- Il tenant ID è lo stesso (7788edaf-0346-4068-9d79-c868aed15b3d)
- Il JWT_SECRET DEVE essere diverso tra ambienti per sicurezza

---

### 2. Aggiornare `dev.yaml`

Aggiungere la sezione Auth Function in `infra/resources/environments/dev.yaml`:

```yaml
# ─── Auth Function ─────────────────────────────────────────────────────
# Configurazione per MSAL Token Validation in ambiente dev

auth_func:
  __local: yaml_auth_func
  # Segreti da Key Vault (dev usa secrets separati)
  MSAL_CLIENT_ID: "kv:auth_msal_client_id_dev"
  MSAL_TENANT_ID: "kv:auth_msal_tenant_id_dev"
  JWT_SECRET: "kv:auth_jwt_secret_dev"
  # Configurazione JWT
  JWT_EXPIRY_SECONDS: "3600"
  JWT_ISSUER: "plsm-auth-service-dev"
  JWT_AUDIENCE: "plsm-fe-smcr-dev"
  # Node.js configuration
  NODE_ENV: "development"
  WEBSITE_RUN_FROM_PACKAGE: "1"
  # Slot staging (per testing)
  staging:
    MSAL_CLIENT_ID: "kv:auth_msal_client_id_dev"
    MSAL_TENANT_ID: "kv:auth_msal_tenant_id_dev"
    JWT_SECRET: "kv:auth_jwt_secret_dev"
    JWT_EXPIRY_SECONDS: "3600"
    JWT_ISSUER: "plsm-auth-service-dev-staging"
    JWT_AUDIENCE: "plsm-fe-smcr-dev-staging"
    NODE_ENV: "development"
    WEBSITE_RUN_FROM_PACKAGE: "1"
```

---

### 3. Aggiungere Data Sources in `dev/data.tf`

Creare il file `infra/resources/dev/data.tf` (se non esiste) o aggiornarlo:

```hcl
# =============================================================================
# Data Sources - Auth Function Secrets
# =============================================================================

data "azurerm_key_vault_secret" "auth_msal_client_id_dev" {
  name         = "auth-msal-client-id-dev"
  key_vault_id = data.azurerm_key_vault.kv_common.id
}

data "azurerm_key_vault_secret" "auth_msal_tenant_id_dev" {
  name         = "auth-msal-tenant-id-dev"
  key_vault_id = data.azurerm_key_vault.kv_common.id
}

data "azurerm_key_vault_secret" "auth_jwt_secret_dev" {
  name         = "auth-jwt-secret-dev"
  key_vault_id = data.azurerm_key_vault.kv_common.id
}
```

**Note:** Verificare che `data.azurerm_key_vault.kv_common` esista già nel file. Se usa un nome diverso, adattare di conseguenza.

---

### 4. Rigenerare `locals_yaml.tf` e `data_kv.tf`

Dopo aver modificato `dev.yaml`, rigenerare i file auto-generated:

```bash
cd infra/resources/dev
python3 ../../scripts/generate_locals.py dev

# Questo genererà/aggiornerà:
# - locals_yaml.tf (con local.auth_func_app_settings)
# - data_kv.tf (con data sources per secrets KV)
```

---

### 5. Creare `dev/auth_func.tf`

Creare il file Terraform per l'Auth Function DEV:

```hcl
# =============================================================================
# Auth Function per MSAL - Azure Function (DEV)
# =============================================================================

module "auth_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "auth"
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

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

# GitHub Actions CD identity per deploy
resource "azurerm_role_assignment" "cd_identity_website_contributor_auth_func" {
  scope                = module.auth_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
}

# Key Vault Secrets User per Managed Identity della function
resource "azurerm_role_assignment" "auth_func_keyvault_reader" {
  scope                = data.azurerm_key_vault.kv_common.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.auth_function.function_app_principal_id
}
```

**Note:**

- Verificare che `azurerm_resource_group.fn_rg` esista (o adattare il nome)
- Verificare che `module.azure_core_infra` esista
- Verificare che `data.azurerm_user_assigned_identity.github_cd_identity` esista
- Se la struttura DEV è diversa da PROD, adattare di conseguenza

---

### 6. Aggiornare `dev/network_cidrs.tf`

Aggiungere il CIDR block per la subnet dell'Auth Function:

```hcl
# Auth Function subnet
resource "dx_available_subnet_cidr" "auth_fa_subnet_cidr" {
  address_space_cidr_block = module.azure_core_infra.common_vnet.address_space[0]
  subnet_size              = 27  # /27 = 32 IPs
  depends_on = [
    # Aggiungere dipendenze dalle altre subnet già definite
    dx_available_subnet_cidr.fe_smcr_subnet_cidr,
    # ...altre subnet...
  ]
}
```

---

### 7. Terraform Plan e Apply

```bash
cd infra/resources/dev

# Inizializzare (se prima volta)
terraform init

# Pianificare
terraform plan -out=tfplan

# Rivedere il piano attentamente
# Dovrebbe creare:
# - 1 Function App (auth)
# - 1 Staging slot
# - 1 Subnet
# - 2 Role assignments
# - N app settings

# Applicare
terraform apply tfplan
```

---

### 8. Aggiornare GitHub Actions CD Workflow

Il workflow `auth-fn-deploy.yaml` è già configurato per supportare DEV. Quando deploy su dev:

```yaml
# Parametri per DEV:
environment: "app-dev"
resource_group_name: "plsm-d-itn-fn-rg-01"
function_app_name: "plsm-d-itn-auth-func-01"
use_staging_slot: true
```

---

### 9. Configurare Azure AD App Registration (DEV)

Se usi un'Azure AD App Registration separata per DEV:

1. Creare nuova App Registration nel portale Azure AD
2. Configurare redirect URIs per dev:
   - `https://plsm-d-itn-fe-smcr-app-01.azurewebsites.net/api/auth/callback/microsoft`
   - `https://plsm-d-itn-fe-smcr-app-01-staging.azurewebsites.net/api/auth/callback/microsoft`
3. Configurare API permissions (stessi di PROD)
4. Usare il Client ID in `auth-msal-client-id-dev` secret

**Oppure** puoi riusare la stessa App Registration di PROD aggiungendo i redirect URIs dev.

---

### 10. Testing

Dopo il deploy:

1. **Health Check:**

   ```bash
   curl https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/health
   ```

2. **Test Token Validation:**
   - Login su frontend dev
   - Ottenere access token da Azure AD
   - Chiamare `/api/v1/auth/validate` con token
   - Verificare che ricevi JWT cookie

3. **Logs e Monitoring:**
   - Verificare Application Insights
   - Controllare log stream in Azure Portal

---

## Naming Convention DEV vs PROD

| Resource       | PROD                      | DEV                       |
| -------------- | ------------------------- | ------------------------- |
| Function App   | `plsm-p-itn-auth-func-01` | `plsm-d-itn-auth-func-01` |
| Resource Group | `plsm-p-itn-fn-rg-01`     | `plsm-d-itn-fn-rg-01`     |
| Key Vault      | `plsm-p-itn-common-kv-01` | `plsm-d-itn-common-kv-01` |
| Secrets Suffix | (nessuno)                 | `-dev`                    |
| JWT Issuer     | `plsm-auth-service`       | `plsm-auth-service-dev`   |
| JWT Audience   | `plsm-fe-smcr`            | `plsm-fe-smcr-dev`        |

---

## Checklist Completa

Prima di considerare il setup completo:

- [ ] Secrets creati in Key Vault DEV
- [ ] `dev.yaml` aggiornato con sezione `auth_func`
- [ ] `dev/data.tf` aggiornato con data sources secrets
- [ ] `locals_yaml.tf` e `data_kv.tf` rigenerati
- [ ] `dev/auth_func.tf` creato
- [ ] `dev/network_cidrs.tf` aggiornato con subnet auth
- [ ] Terraform plan rivisto
- [ ] Terraform apply completato con successo
- [ ] Azure AD App Registration configurata (se separata)
- [ ] Health check funzionante
- [ ] Test token validation OK
- [ ] Logs visibili in Application Insights
- [ ] Documentazione aggiornata

---

## Troubleshooting

### Errore: "Secret not found in Key Vault"

- Verificare che i secrets esistano: `az keyvault secret list --vault-name plsm-d-itn-common-kv-01`
- Verificare naming: deve essere `auth-msal-client-id-dev` (con trattini, non underscore)

### Errore: "Subnet CIDR conflict"

- Verificare che il CIDR /27 non si sovrapponga ad altre subnet
- Controllare `network_cidrs.tf` e le dipendenze

### Errore: "Permission denied on Key Vault"

- Verificare role assignment "Key Vault Secrets User"
- Controllare Managed Identity della Function App

### Health check fallisce

- Verificare che il codice sia deployato: controllare in Azure Portal
- Controllare logs: `az functionapp log tail --name plsm-d-itn-auth-func-01 --resource-group plsm-d-itn-fn-rg-01`

---

## Riferimenti

- **Architettura**: `docs/msal/MSAL_ARCHITECTURE_SOLUTION.md`
- **Config Finale**: `docs/msal/AUTH_ARCHITECTURE_FINAL.md`
- **Checklist Migrazione**: `docs/msal/AUTH_MIGRATION_CHECKLIST.md`
- **PROD Config**: `infra/resources/prod/auth_func.tf`
- **PROD YAML**: `infra/resources/environments/prod.yaml`

---

**Ultimo aggiornamento**: 8 Marzo 2026  
**Autore**: Service Management Team  
**Stato**: 🟡 Ready for implementation (dopo merge branch dev)
