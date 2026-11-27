# =============================================================================
# Aggregator Function - increment enti aggregati verso Selfcare (DEV)
# SMION-923, epica SMION-781
# =============================================================================

module "aggregator_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "aggregator"
    instance_number = "01"
  })

  application_insights_connection_string = data.azurerm_key_vault_secret.appinsights_connection_string.value
  application_insights_key               = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value

  resource_group_name = data.azurerm_resource_group.apps_rg.name
  tags                = local.tags

  virtual_network = {
    name                = data.azurerm_virtual_network.vnet.name
    resource_group_name = data.azurerm_resource_group.network_rg.name
  }
  subnet_pep_id = data.azurerm_subnet.pep_snet.id
  # Il piano accetta max 2 subnet di VNet integration (FE + auth): condivide quella dell'auth,
  # come crm e signature in prod (SMION-955)
  subnet_id = module.auth_function.func_details.function_app.subnet.id

  # Come l'auth function (SMION-955): sul piano del FE SMCR, nessun piano nuovo
  app_service_plan_id = module.azure_fe_app_service_smcr.app_service.plan.id

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.aggregator_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.aggregator_slot_func_app_settings)
}

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

# GitHub Actions CD identity per deploy
resource "azurerm_role_assignment" "cd_identity_website_contributor_aggregator_func" {
  scope                = module.aggregator_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
}

# Key Vault Secrets User per Managed Identity della function
resource "azurerm_role_assignment" "aggregator_func_keyvault_reader" {
  scope                = data.azurerm_key_vault.common_kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.aggregator_function.function_app_principal_id
}
