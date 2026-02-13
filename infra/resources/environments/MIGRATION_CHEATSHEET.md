# 🔄 Migration Cheat Sheet - Altre Apps

## Quick Reference per Replicare POC su Altri Resources

Questa guida ti permette di migrare **qualsiasi altro resource** (askmebot, certificates, onboarding, ecc.) senza bisogno di assistenza.

---

## 📋 Checklist Migrazione (15 minuti per resource)

### ✅ Pre-requisiti

- [ ] POC CRM Function testato e funzionante (`terraform plan` = No changes)
- [ ] Hai identificato il resource da migrare (es. `askmebot`)
- [ ] Hai accesso a `infra/resources/prod/locals.tf`

---

## 🔧 Step-by-Step (Esempio: askmebot)

### Step 1: Identifica Configurazione Attuale (2 min)

```bash
# Apri locals.tf e cerca la sezione del resource
vim infra/resources/prod/locals.tf

# Cerca: askmebot_func_app_settings (linea ~100)
# Nota:
# - Numero di settings (es. 26 settings)
# - Quali sono secrets Key Vault vs valori hardcoded
# - Differenze tra production e staging slot
```

**Esempio output**:

```hcl
askmebot_func_app_settings = {
  SERVICENAME        = "Ask Me Bot"
  SLACK_BOT_TOKEN    = "${data.azurerm_key_vault_secret.askmebot_slack_bot_token.value}"
  NODE_ENV           = "production"
  SMTP_HOST          = "smtp.gmail.com"
  # ... altri 22 settings
}

askmebot_func_slot_app_settings = {
  # ... stessi settings con piccole differenze
}
```

---

### Step 2: Aggiungi Sezione YAML (5 min)

```bash
# Apri prod.yaml
vim infra/resources/environments/prod.yaml

# Aggiungi alla fine del file (dopo crm_function):
```

```yaml
# =============================================================================
# Askmebot Function App Settings
# =============================================================================

askmebot_function:
  # Resource configuration
  app_name: "askmebot"
  instance_number: "01"
  node_version: 22

  # Production slot app settings
  production:
    # Secrets (reference Key Vault secret names)
    slack_bot_token_secret: "askmebot_slack_bot_token"
    slack_signing_secret_secret: "askmebot_slack_signing_secret"
    smtp_password_secret: "askmebot_smtp_password"

    # Non-secret configuration
    servicename: "Ask Me Bot"
    node_env: "production"
    smtp_host: "smtp.gmail.com"
    smtp_port: "587"
    smtp_secure: false
    smtp_username: "noreply@pagopa.it"
    from_email: "noreply@pagopa.it"
    ccn_email: "Bot_Selfcare@pagopa.it"
    max_data_length: "10"
    appinsights_sampling_percentage: 5

    # URLs (non-sensitive)
    slack_api_url: "https://slack.com/api"
    institution_url: "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    users_url: "https://api.selfcare.pagopa.it/external/internal/v1/institutions"
    contract_url: "https://api.selfcare.pagopa.it/external/support/v1/institutions"

  # Staging slot app settings
  staging:
    # Same as production, or override specific values
    slack_bot_token_secret: "askmebot_slack_bot_token"
    # ... (puoi omettere se identici a production)
```

**💡 Tips**:

- Usa `_secret` suffix per indicare secrets Key Vault
- Raggruppa per tipo (secrets, config, URLs)
- Commenta se non ovvio

---

### Step 3: Aggiungi Parser YAML (5 min)

```bash
# Apri locals_yaml.tf
vim infra/resources/prod/locals_yaml.tf

# Aggiungi dopo la sezione CRM (linea ~60):
```

```hcl
  # Build Askmebot Function production app settings from YAML
  yaml_askmebot_func_app_settings = {
    # Secrets from Key Vault
    SLACK_BOT_TOKEN    = data.azurerm_key_vault_secret.askmebot_slack_bot_token.value
    SLACK_SIGNING_SECRET = data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value
    SMTP_PASSWORD      = data.azurerm_key_vault_secret.askmebot_smtp_password.value

    # Non-secret config from YAML
    SERVICENAME        = local.env_config.askmebot_function.production.servicename
    NODE_ENV           = local.env_config.askmebot_function.production.node_env
    SMTP_HOST          = local.env_config.askmebot_function.production.smtp_host
    SMTP_PORT          = local.env_config.askmebot_function.production.smtp_port
    SMTP_SECURE        = local.env_config.askmebot_function.production.smtp_secure
    SMTP_USERNAME      = local.env_config.askmebot_function.production.smtp_username
    FROM_EMAIL         = local.env_config.askmebot_function.production.from_email
    CCN_EMAIL          = local.env_config.askmebot_function.production.ccn_email
    MAX_DATA_LENGTH    = local.env_config.askmebot_function.production.max_data_length

    # URLs from YAML
    SLACK_API_URL      = local.env_config.askmebot_function.production.slack_api_url
    INSTITUTION_URL    = local.env_config.askmebot_function.production.institution_url
    USERS_URL          = local.env_config.askmebot_function.production.users_url
    CONTRACT_URL       = local.env_config.askmebot_function.production.contract_url

    # Common settings (already in YAML)
    APPINSIGHTS_SAMPLING_PERCENTAGE = local.env_config.askmebot_function.production.appinsights_sampling_percentage
  }

  # Build Askmebot Function staging slot app settings from YAML
  yaml_askmebot_func_slot_app_settings = {
    # Same structure as production, but read from .staging section
    SLACK_BOT_TOKEN    = data.azurerm_key_vault_secret.askmebot_slack_bot_token.value
    # ... (repeat for all settings)
  }
```

**💡 Pattern**:

1. Secrets: `data.azurerm_key_vault_secret.<name>.value`
2. Config: `local.env_config.<resource>_function.production.<key>`
3. Naming: YAML usa `snake_case`, Terraform usa `UPPER_SNAKE_CASE`

---

### Step 4: Aggiorna locals.tf (2 min)

```bash
# Apri locals.tf
vim infra/resources/prod/locals.tf

# Trova la sezione askmebot (linea ~100)
# Commenta la vecchia configurazione:
```

**Before**:

```hcl
  askmebot_func_app_settings = {
    SERVICENAME = "Ask Me Bot"
    # ... 26 settings
  }
```

**After**:

```hcl
  # =============================================================================
  # Askmebot Function - YAML-BASED CONFIGURATION
  # =============================================================================
  # Migrated to YAML: infra/resources/environments/prod.yaml
  # Parser: infra/resources/prod/locals_yaml.tf

  askmebot_func_app_settings      = local.yaml_askmebot_func_app_settings
  askmebot_func_slot_app_settings = local.yaml_askmebot_func_slot_app_settings

  # OLD HARDCODED CONFIGURATION (COMMENTED FOR REFERENCE)
  # askmebot_func_app_settings = {
  #   SERVICENAME = "Ask Me Bot"
  #   # ... (commenta tutto)
  # }
```

---

### Step 5: Test Idempotenza (3 min)

```bash
cd infra/resources/prod

# Format
terraform fmt

# Validate syntax
terraform validate

# CRITICAL: Plan must show NO CHANGES
terraform plan

# Expected output:
# "No changes. Your infrastructure matches the configuration."
```

**Se vedi modifiche** ❌:

1. Confronta vecchia vs nuova config con `terraform console`:
   ```bash
   terraform console
   > local.yaml_askmebot_func_app_settings
   > exit
   ```
2. Verifica typos in YAML keys
3. Verifica che secret names in `data.tf` corrispondano a YAML

**Se vedi "No changes"** ✅:

- Commit su branch separato
- PR con label "infrastructure/refactor"
- Merge dopo review

---

## 🎯 Quick Reference Table

| Resource     | Locals.tf Lines | YAML Complexity | Estimated Time |
| ------------ | --------------- | --------------- | -------------- |
| crm          | 14              | Low             | **✅ DONE**    |
| certificates | 12              | Low             | 15 min         |
| pf           | 6               | Low             | 10 min         |
| onboarding   | 20              | Medium          | 25 min         |
| askmebot     | 52              | High            | 35 min         |
| fe_smcr      | 80              | Very High       | 60 min         |

---

## 🚀 Script Helper

Ho creato uno script che genera template:

```bash
# Usage
./infra/resources/environments/migrate_to_yaml.sh askmebot

# Output: Step-by-step instructions + templates
```

---

## 📖 Full Documentation

Per dettagli completi:

- Migration guide: `infra/resources/environments/README.md`
- CRM example: `infra/resources/environments/prod.yaml` (lines 20-50)
- Parser example: `infra/resources/prod/locals_yaml.tf` (lines 20-60)

---

## 🆘 Troubleshooting

### Errore: "local.env_config.askmebot_function not found"

**Causa**: Typo nel nome resource in YAML  
**Fix**: Verifica che `askmebot_function:` in YAML corrisponda a `local.env_config.askmebot_function` in locals_yaml.tf

### Errore: "data.azurerm_key_vault_secret.xxx not found"

**Causa**: Secret non definito in `data.tf`  
**Fix**: Aggiungi data source in `data.tf`:

```hcl
data "azurerm_key_vault_secret" "askmebot_slack_bot_token" {
  name         = "askmebot-slack-bot-token"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
```

### Plan mostra modifiche a settings esistenti

**Causa**: Mismatch tra vecchia config e YAML  
**Fix**: Usa `terraform console` per debug:

```bash
terraform console
> local.yaml_askmebot_func_app_settings["SMTP_HOST"]
> exit
```

---

## 💾 Backup & Rollback

**Prima di ogni migrazione**:

```bash
cp infra/resources/prod/locals.tf infra/resources/prod/locals.tf.backup
```

**Rollback se fallisce**:

```bash
mv infra/resources/prod/locals.tf.backup infra/resources/prod/locals.tf
terraform plan  # Verify no changes
```

---

## ✅ Success Criteria

Prima di committare, verifica:

- [ ] `terraform plan` mostra "No changes"
- [ ] Ho testato con `terraform console` i locals generati
- [ ] Ho commentato vecchia config in `locals.tf` (non eliminato)
- [ ] Ho aggiornato YAML con commenti chiari
- [ ] Ho creato backup di `locals.tf`
- [ ] Ho testato rollback procedure (opzionale)

---

**Template files**: Vedi `infra/resources/environments/` per tutti gli esempi.

**Questions?** Rileggi `README.md` o `COMPARISON.md` per esempi visivi.
