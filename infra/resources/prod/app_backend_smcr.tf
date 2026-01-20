# =============================================================================
# App Service Backend - BSMCR
# =============================================================================

module "azure_app_service_backend_smcr" {
  source       = "../_modules/app_service"
  node_version = 22

  virtual_network = {
    resource_group_name = module.azure_core_infra.network_resource_group_name
    name                = module.azure_core_infra.common_vnet.name
  }
  resource_group_name = azurerm_resource_group.apps_rg.name

  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.app_backend_service_subnet_cidr.cidr_block

  environment = merge(local.environment, { app_name = "BSMCR", instance_number = local.instance_number })

  app_settings      = merge(local.common_app_settings, local.backend_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.backend_slot_app_settings)

  health_check_path = "/api/health"
  tags              = local.tags

  depends_on = [module.azure_core_infra]
}

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

resource "azurerm_role_assignment" "cd_identity_website_contrib_backend_smcr" {
  scope                = module.azure_app_service_backend_smcr.web_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id

  depends_on = [module.azure_app_service_backend_smcr]
}

resource "azurerm_role_assignment" "ci_identity_website_contrib_backend_smcr" {
  scope                = module.azure_app_service_backend_smcr.web_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id

  depends_on = [module.azure_app_service_backend_smcr]
}

resource "azurerm_role_assignment" "smcr_portalefatturazione_storage_contributor" {
  principal_id         = module.azure_app_service_backend_smcr.principal_id
  scope                = var.container_pf
  role_definition_name = "Storage Blob Data Contributor"

  depends_on = [module.azure_app_service_backend_smcr]
}