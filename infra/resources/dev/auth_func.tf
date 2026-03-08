# =============================================================================
# Auth Function per MSAL - Azure Function (DEV)
# =============================================================================

module "auth_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "auth"
    instance_number = "01"
  })

  application_insights_connection_string = azurerm_key_vault_secret.appinsights_connection_string.value
  application_insights_key               = azurerm_key_vault_secret.appinsights_instrumentationkey.value

  resource_group_name = data.azurerm_resource_group.apps_rg.name
  tags                = local.tags

  virtual_network = {
    name                = data.azurerm_virtual_network.vnet.name
    resource_group_name = data.azurerm_resource_group.network_rg.name
  }
  subnet_pep_id = data.azurerm_subnet.pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.auth_fa_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.auth_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.auth_slot_func_app_settings)
}

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

# GitHub Actions CD identity per deploy
resource "azurerm_role_assignment" "cd_identity_website_contributor_auth_func" {
  scope                = module.auth_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id

  depends_on = [module.auth_function]
}

# Key Vault Secrets User per Managed Identity della function
resource "azurerm_role_assignment" "auth_func_keyvault_reader" {
  scope                = data.azurerm_key_vault.common_kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.auth_function.function_app_principal_id

  depends_on = [module.auth_function]
}
