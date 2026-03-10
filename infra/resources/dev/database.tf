# =============================================================================
# PostgreSQL — ephemeral, destroyed with the rest of DEV resources
# =============================================================================

module "postgres_apps" {
  source = "../_modules/postgres"

  environment         = local.environment
  resource_group_name = data.azurerm_resource_group.common_rg.name
  key_vault_id        = data.azurerm_key_vault.common_kv.id

  private_dns_zone_resource_group_name = data.azurerm_resource_group.network_rg.name

  subnet_pep_id     = data.azurerm_subnet.pep_snet.id
  tags              = local.tags
  postgres_username = azurerm_key_vault_secret.postgres_username.value
  postgres_password = azurerm_key_vault_secret.postgres_password.value

  app_name = "apps"
}

# =============================================================================
# Credentials — stored in KV for the app to consume
# =============================================================================

resource "random_password" "password" {
  length  = 16
  special = true
}

resource "azurerm_key_vault_secret" "postgres_username" {
  name         = "postgres-username"
  value        = "adminuser"
  key_vault_id = data.azurerm_key_vault.common_kv.id
  content_type = "text"
}

resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "postgres-password"
  value        = random_password.password.result
  key_vault_id = data.azurerm_key_vault.common_kv.id
  content_type = "password"
}

# FQDN del server postgres costruito dal nome — usato da locals.tf
resource "azurerm_key_vault_secret" "db_host" {
  name         = "db-host"
  value        = "${module.postgres_apps.postgres.name}.postgres.database.azure.com"
  key_vault_id = data.azurerm_key_vault.common_kv.id
  content_type = "text"

  depends_on = [module.postgres_apps]
}

# Password in base64 — formato atteso dall'app
resource "azurerm_key_vault_secret" "db_password_b64" {
  name         = "db-password-b64"
  value        = base64encode(random_password.password.result)
  key_vault_id = data.azurerm_key_vault.common_kv.id
  content_type = "password"
}
