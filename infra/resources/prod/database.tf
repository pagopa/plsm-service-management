# =============================================================================
# PostgreSQL Database
# =============================================================================

module "postgres_apps" {
  source = "../_modules/postgres"

  environment         = local.environment
  resource_group_name = module.azure_core_infra.common_resource_group_name
  key_vault_id        = module.azure_core_infra.common_key_vault.id

  private_dns_zone_resource_group_name = module.azure_core_infra.network_resource_group_name

  subnet_pep_id     = module.azure_core_infra.common_pep_snet.id
  tags              = local.tags
  postgres_username = azurerm_key_vault_secret.postgres_username.value
  postgres_password = azurerm_key_vault_secret.postgres_password.value

  depends_on = [module.azure_core_infra]
  app_name   = "apps"
}

# -----------------------------------------------------------------------------
# Database Credentials
# -----------------------------------------------------------------------------

resource "random_password" "password" {
  length  = 16
  special = true
}

resource "azurerm_key_vault_secret" "postgres_username" {
  name         = "postgres-username"
  value        = "adminuser"
  key_vault_id = module.azure_core_infra.common_key_vault.id
  content_type = "text"

  depends_on = [azurerm_role_assignment.kv_group_secrets_officer]
}

resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "postgres-password"
  value        = random_password.password.result
  key_vault_id = module.azure_core_infra.common_key_vault.id
  content_type = "password"

  depends_on = [azurerm_role_assignment.kv_group_secrets_officer]
}