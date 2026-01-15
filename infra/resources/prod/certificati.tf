# =============================================================================
# Certificati - Azure Function
# =============================================================================

module "certifica_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "cert",
    instance_number = "01"
  })

  application_insights_connection_string   = data.azurerm_key_vault_secret.appinsights_connection_string.value
  application_insights_key                 = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value

  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.network_resource_group_name
  }
  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.function_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.certificates_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.certificates_slot_func_app_settings)

  depends_on = [module.azure_core_infra]
}

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

resource "azurerm_role_assignment" "cd_identity_website_contributor_on_func" {
  scope                = data.azurerm_linux_function_app.plsm_cert_func.id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
}