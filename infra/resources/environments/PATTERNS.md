# 🎨 YAML Configuration Patterns - Reusable Templates

## Common Patterns per Diverse Tipologie di Resources

Usa questi template come base per migrare altri resources.

---

## Pattern 1: Simple Function (Low Complexity)

**Example**: Certificates Function, Portale Fatturazione

**Caratteristiche**:

- Pochi settings (< 10)
- Principalmente secrets Key Vault
- Poche differenze tra production/staging

### YAML Template

```yaml
<resource>_function:
  app_name: "<name>"
  instance_number: "01"

  production:
    # Secrets
    secret_name_secret: "kv-secret-name"

    # Config
    db_name: "database_name"
    db_port: 5432
    db_ssl: true

  staging:
    # Usually identical to production
    secret_name_secret: "kv-secret-name"
    db_name: "database_name"
    db_port: 5432
    db_ssl: true
```

### locals_yaml.tf Template

```hcl
locals {
  yaml_<resource>_func_app_settings = {
    SECRET_NAME = data.azurerm_key_vault_secret.<resource>_secret_name.value
    DB_NAME     = local.env_config.<resource>_function.production.db_name
    DB_PORT     = local.env_config.<resource>_function.production.db_port
    DB_SSL      = local.env_config.<resource>_function.production.db_ssl
  }

  yaml_<resource>_func_slot_app_settings = {
    SECRET_NAME = data.azurerm_key_vault_secret.<resource>_secret_name.value
    DB_NAME     = local.env_config.<resource>_function.staging.db_name
    DB_PORT     = local.env_config.<resource>_function.staging.db_port
    DB_SSL      = local.env_config.<resource>_function.staging.db_ssl
  }
}
```

---

## Pattern 2: Function with Multiple Secrets (Medium Complexity)

**Example**: Onboarding Function, Askmebot

**Caratteristiche**:

- Molti secrets Key Vault (5-15)
- URL esterni (API endpoints)
- Configurazioni runtime (SMTP, Slack, etc.)

### YAML Template

```yaml
<resource>_function:
  app_name: "<name>"
  instance_number: "01"
  node_version: 22

  production:
    # === Secrets Group 1: Authentication ===
    api_key_secret: "kv-api-key"
    subscription_key_secret: "kv-subscription-key"

    # === Secrets Group 2: External Services ===
    slack_webhook_secret: "kv-slack-webhook"
    smtp_password_secret: "kv-smtp-password"

    # === Configuration: External URLs ===
    api_base_url: "https://api.example.com"
    institution_endpoint: "external/v1/institutions"

    # === Configuration: Runtime ===
    node_env: "production"
    max_retries: 3
    timeout_seconds: 30

    # === Configuration: Feature Flags ===
    feature_new_api: true
    feature_debug_mode: false

  staging:
    # Secrets - typically same as production
    api_key_secret: "kv-api-key"

    # URLs - may differ for staging
    api_base_url: "https://api-staging.example.com"

    # Runtime - may have different values
    feature_debug_mode: true # Enable debug in staging
```

### locals_yaml.tf Template

```hcl
locals {
  yaml_<resource>_func_app_settings = {
    # Secrets
    API_KEY           = data.azurerm_key_vault_secret.<resource>_api_key.value
    SUBSCRIPTION_KEY  = data.azurerm_key_vault_secret.<resource>_subscription_key.value
    SLACK_WEBHOOK     = data.azurerm_key_vault_secret.<resource>_slack_webhook.value
    SMTP_PASSWORD     = data.azurerm_key_vault_secret.<resource>_smtp_password.value

    # External URLs
    API_BASE_URL          = local.env_config.<resource>_function.production.api_base_url
    INSTITUTION_ENDPOINT  = local.env_config.<resource>_function.production.institution_endpoint

    # Runtime config
    NODE_ENV          = local.env_config.<resource>_function.production.node_env
    MAX_RETRIES       = local.env_config.<resource>_function.production.max_retries
    TIMEOUT_SECONDS   = local.env_config.<resource>_function.production.timeout_seconds

    # Feature flags
    FEATURE_NEW_API   = local.env_config.<resource>_function.production.feature_new_api
    FEATURE_DEBUG_MODE = local.env_config.<resource>_function.production.feature_debug_mode
  }

  yaml_<resource>_func_slot_app_settings = {
    # Same structure, read from .staging section
    API_KEY           = data.azurerm_key_vault_secret.<resource>_api_key.value
    API_BASE_URL      = local.env_config.<resource>_function.staging.api_base_url
    FEATURE_DEBUG_MODE = local.env_config.<resource>_function.staging.feature_debug_mode
    # ... etc
  }
}
```

---

## Pattern 3: App Service (High Complexity)

**Example**: Frontend SMCR, Backend SMCR

**Caratteristiche**:

- Molti settings (30+)
- Database connections
- Multiple API integrations
- Environment-specific URLs (redirect URIs, etc.)

### YAML Template

```yaml
<resource>_app:
  app_name: "<name>"
  instance_number: "01"

  production:
    # === Database ===
    database:
      host_secret: "kv-db-host"
      user_secret: "kv-db-user"
      password_secret: "kv-db-password"
      name: "dbname"
      port: 5432
      ssl: true

    # === External APIs ===
    external_apis:
      selfcare_base_url: "https://api.selfcare.pagopa.it"
      institution_endpoint: "external/support/v1/institutions"
      users_endpoint: "external/internal/v1/institutions"

    # === API Keys (Secrets) ===
    api_keys:
      users_key_secret: "kv-users-api-key"
      services_key_secret: "kv-services-api-key"
      institution_key_secret: "kv-institution-api-key"

    # === Slack Webhooks ===
    slack:
      report_hook_secret: "kv-slack-report-hook"
      call_management_hook_secret: "kv-slack-call-hook"

    # === App-Specific URLs (Environment-Dependent) ===
    app_urls:
      public_url: "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net"
      msal_redirect_uri: "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/api/auth/callback/microsoft"
      post_login_redirect: "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net"

    # === Azure AD / MSAL ===
    azure_ad:
      client_id_secret: "kv-msal-client-id"
      tenant_id_secret: "kv-msal-tenant-id"

  staging:
    # Database - same as production
    database:
      host_secret: "kv-db-host"
      user_secret: "kv-db-user"
      password_secret: "kv-db-password"
      name: "dbname"
      port: 5432
      ssl: true

    # External APIs - same as production
    external_apis:
      selfcare_base_url: "https://api.selfcare.pagopa.it"
      institution_endpoint: "external/support/v1/institutions"

    # API Keys - same as production
    api_keys:
      users_key_secret: "kv-users-api-key"

    # App URLs - DIFFERENT for staging slot
    app_urls:
      public_url: "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net"
      msal_redirect_uri: "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net/api/auth/callback/microsoft"
      post_login_redirect: "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net"

    # Azure AD - same as production
    azure_ad:
      client_id_secret: "kv-msal-client-id"
      tenant_id_secret: "kv-msal-tenant-id"
```

### locals_yaml.tf Template

```hcl
locals {
  yaml_<resource>_app_settings = {
    # Database
    DB_HOST         = data.azurerm_key_vault_secret.<resource>_db_host.value
    DB_USER         = data.azurerm_key_vault_secret.<resource>_db_user.value
    DB_PASSWORD     = data.azurerm_key_vault_secret.<resource>_db_password.value
    DB_NAME         = local.env_config.<resource>_app.production.database.name
    DB_PORT         = local.env_config.<resource>_app.production.database.port
    DB_SSL          = local.env_config.<resource>_app.production.database.ssl

    # External APIs
    ONBOARDING_BASE_PATH = local.env_config.<resource>_app.production.external_apis.selfcare_base_url
    GET_INSTITUTION      = local.env_config.<resource>_app.production.external_apis.institution_endpoint
    GET_USERS            = local.env_config.<resource>_app.production.external_apis.users_endpoint

    # API Keys
    USERS_API_KEY       = data.azurerm_key_vault_secret.<resource>_users_api_key.value
    SERVICES_API_KEY    = data.azurerm_key_vault_secret.<resource>_services_api_key.value
    INSTITUTION_API_KEY = data.azurerm_key_vault_secret.<resource>_institution_api_key.value

    # Slack
    SLACK_REPORT_HOOK = data.azurerm_key_vault_secret.<resource>_slack_report_hook.value
    SLACK_CALL_HOOK   = data.azurerm_key_vault_secret.<resource>_slack_call_hook.value

    # App URLs (environment-specific)
    NEXT_PUBLIC_APP_URL             = local.env_config.<resource>_app.production.app_urls.public_url
    NEXT_PUBLIC_MSAL_REDIRECT_URI   = local.env_config.<resource>_app.production.app_urls.msal_redirect_uri
    NEXT_PUBLIC_POST_LOGIN_REDIRECT = local.env_config.<resource>_app.production.app_urls.post_login_redirect

    # Azure AD
    NEXT_PUBLIC_MSAL_CLIENT_ID = data.azurerm_key_vault_secret.<resource>_msal_client_id.value
    NEXT_PUBLIC_MSAL_TENANT_ID = data.azurerm_key_vault_secret.<resource>_msal_tenant_id.value
  }

  yaml_<resource>_slot_app_settings = {
    # Same structure, but:
    # - Database/API keys same
    # - App URLs DIFFERENT (staging slot URLs)

    DB_HOST         = data.azurerm_key_vault_secret.<resource>_db_host.value
    # ... (repeat database settings)

    # App URLs use staging values
    NEXT_PUBLIC_APP_URL             = local.env_config.<resource>_app.staging.app_urls.public_url
    NEXT_PUBLIC_MSAL_REDIRECT_URI   = local.env_config.<resource>_app.staging.app_urls.msal_redirect_uri
    NEXT_PUBLIC_POST_LOGIN_REDIRECT = local.env_config.<resource>_app.staging.app_urls.post_login_redirect
  }
}
```

---

## Pattern 4: Conditional Configuration (Advanced)

**Use case**: Different behavior per environment (prod vs uat vs dev)

### YAML Template

```yaml
<resource>_function:
  app_name: "<name>"

  # Environment-agnostic settings
  common:
    node_version: 22
    health_check_path: "/api/v1/health"

  production:
    # Prod-specific
    log_level: "error"
    debug_mode: false
    rate_limit: 1000

  staging:
    # Staging can be more verbose
    log_level: "info"
    debug_mode: true
    rate_limit: 500
```

### locals_yaml.tf Template with Conditionals

```hcl
locals {
  # Determine environment from workspace or variable
  current_env = terraform.workspace  # or var.environment

  # Select config based on environment
  <resource>_env_config = (
    local.current_env == "production"
      ? local.env_config.<resource>_function.production
      : local.env_config.<resource>_function.staging
  )

  yaml_<resource>_func_app_settings = {
    NODE_VERSION        = local.env_config.<resource>_function.common.node_version
    HEALTH_CHECK_PATH   = local.env_config.<resource>_function.common.health_check_path
    LOG_LEVEL           = local.<resource>_env_config.log_level
    DEBUG_MODE          = local.<resource>_env_config.debug_mode
    RATE_LIMIT          = local.<resource>_env_config.rate_limit
  }
}
```

---

## Pattern 5: DRY with Inheritance (Advanced)

**Use case**: Staging inherits from production, overrides only specific values

### YAML Template

```yaml
<resource>_function:
  production:
    api_url: "https://api.prod.example.com"
    timeout: 30
    retries: 3
    debug: false

  staging:
    # Inherit all from production, override only these:
    api_url: "https://api-staging.example.com"
    debug: true
    # timeout and retries inherited
```

### locals_yaml.tf Template with Merge

```hcl
locals {
  # Merge production + staging (staging overrides production)
  <resource>_merged_staging = merge(
    local.env_config.<resource>_function.production,
    local.env_config.<resource>_function.staging
  )

  yaml_<resource>_func_app_settings = {
    API_URL = local.env_config.<resource>_function.production.api_url
    TIMEOUT = local.env_config.<resource>_function.production.timeout
    RETRIES = local.env_config.<resource>_function.production.retries
    DEBUG   = local.env_config.<resource>_function.production.debug
  }

  yaml_<resource>_func_slot_app_settings = {
    API_URL = local.<resource>_merged_staging.api_url      # Uses staging value
    TIMEOUT = local.<resource>_merged_staging.timeout      # Inherited from prod
    RETRIES = local.<resource>_merged_staging.retries      # Inherited from prod
    DEBUG   = local.<resource>_merged_staging.debug        # Uses staging value
  }
}
```

---

## 🎯 Naming Conventions

### YAML Keys (snake_case)

```yaml
api_key_secret: "..."
smtp_password_secret: "..."
max_retry_count: 3
```

### Terraform Variables (UPPER_SNAKE_CASE)

```hcl
API_KEY = "..."
SMTP_PASSWORD = "..."
MAX_RETRY_COUNT = 3
```

### Conversion Pattern

```hcl
# YAML: smtp_password_secret
# Terraform: SMTP_PASSWORD
# Convention: Remove "_secret" suffix, uppercase
```

---

## 📖 Best Practices

### 1. Grouping

Raggruppa settings logicamente:

```yaml
# Good
database:
  host: "..."
  port: 5432
  ssl: true

# Bad (flat)
db_host: "..."
db_port: 5432
db_ssl: true
```

### 2. Secrets Naming

Usa `_secret` suffix per secrets Key Vault:

```yaml
# Good
slack_webhook_secret: "kv-slack-webhook"

# Bad (ambiguous)
slack_webhook: "kv-slack-webhook"
```

### 3. Comments

Commenta sezioni non ovvie:

```yaml
# === External APIs ===
api_base_url: "https://..."

# === Feature Flags (Experimental) ===
feature_new_dashboard: false # TODO: Enable in Q2 2026
```

### 4. Defaults in common.yaml

Settings comuni a tutti resources:

```yaml
# common.yaml
defaults:
  node_version: 22
  health_check_path: "/health"
  timeout_seconds: 30
```

Poi usa in prod.yaml:

```yaml
# prod.yaml
<resource>_function:
  node_version: 22 # From common.defaults.node_version
```

---

## ✅ Quick Checklist

Quando migri un resource, verifica:

- [ ] YAML keys usano `snake_case`
- [ ] Secrets hanno `_secret` suffix
- [ ] Settings raggruppati logicamente
- [ ] Commenti per sezioni complesse
- [ ] Production e staging side-by-side (easy comparison)
- [ ] Terraform locals usano `UPPER_SNAKE_CASE`
- [ ] Nessun valore hardcoded sensibile in YAML
- [ ] `terraform plan` mostra "No changes"

---

**Template Repository**: Tutti i pattern sono in `infra/resources/environments/prod.yaml` (CRM example)
