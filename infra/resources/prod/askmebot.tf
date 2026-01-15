# =============================================================================
# Ask Me Everything BOT - Azure Function (Exposed)
# =============================================================================

module "askmebot_function" {
  source = "../_modules/function_app_exposed"

  environment = merge(local.environment, {
    app_name        = "askmebot",
    instance_number = "01"
  })

  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  health_check_path = "/api/v1/info"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.askmebot_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.askmebot_func_slot_app_settings)

  depends_on = [module.azure_core_infra]
}

# -----------------------------------------------------------------------------
# VNet Integration
# Permette alla Function di comunicare con risorse in VNet privata
# Usa la stessa subnet della web app FE-SMCR
# -----------------------------------------------------------------------------

resource "azurerm_app_service_virtual_network_swift_connection" "askmebot_vnet_integration" {
  app_service_id = module.askmebot_function.function_app_id
  subnet_id      = module.azure_fe_app_service_smcr.subnet_id

  depends_on = [
    module.askmebot_function,
    module.azure_fe_app_service_smcr
  ]
}

# VNet Integration per lo slot staging
resource "azurerm_app_service_slot_virtual_network_swift_connection" "askmebot_slot_vnet_integration" {
  slot_name      = "staging"
  app_service_id = module.askmebot_function.function_app_id
  subnet_id      = module.azure_fe_app_service_smcr.subnet_id

  depends_on = [
    module.askmebot_function,
    module.azure_fe_app_service_smcr
  ]
}

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

resource "azurerm_role_assignment" "cd_identity_website_contrib_askmebot_fa" {
  scope                = module.askmebot_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id

  depends_on = [module.askmebot_function]
}
