# =============================================================================
# App Service Frontend - FE-SMCR
# =============================================================================

module "azure_fe_app_service_smcr" {
  source       = "../_modules/app_service"
  node_version = 22

  virtual_network = {
    resource_group_name = module.azure_core_infra.network_resource_group_name
    name                = module.azure_core_infra.common_vnet.name
  }
  resource_group_name = azurerm_resource_group.apps_rg.name

  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.app_service_subnet_cidr.cidr_block

  environment = merge(local.environment, { app_name = "FE-SMCR", instance_number = local.instance_number })

  app_settings      = merge(local.common_app_settings, local.fe_smcr_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.fe_smcr_slot_app_settings)

  health_check_path = "/api/health"
  tags              = local.tags

  depends_on = [module.azure_core_infra]
}

# -----------------------------------------------------------------------------
# Startup Command
# Il modulo DX non supporta app_command_line, quindi usiamo azapi
# -----------------------------------------------------------------------------

# TODO

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

resource "azurerm_role_assignment" "cd_identity_website_contrib_smcr" {
  scope                = module.azure_fe_app_service_smcr.web_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id

  depends_on = [module.azure_fe_app_service_smcr]
}

resource "azurerm_role_assignment" "ci_identity_website_contrib_smcr" {
  scope                = module.azure_fe_app_service_smcr.web_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id

  depends_on = [module.azure_fe_app_service_smcr]
}