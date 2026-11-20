# =============================================================================
# Resource Group — creato in dev-base, qui solo referenziato
# =============================================================================

data "azurerm_resource_group" "apps_rg" {
  name = "plsm-d-itn-apps-rg-01"
}

# =============================================================================
# App Service Frontend - FE-SMCR
# =============================================================================

module "azure_fe_app_service_smcr" {
  source       = "../_modules/app_service"
  node_version = 22

  virtual_network = {
    resource_group_name = data.azurerm_resource_group.network_rg.name
    name                = data.azurerm_virtual_network.vnet.name
  }
  resource_group_name = data.azurerm_resource_group.apps_rg.name

  subnet_pep_id = data.azurerm_subnet.pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.app_service_subnet_cidr.cidr_block

  environment = merge(local.environment, { app_name = "FE-SMCR", instance_number = local.instance_number })

  app_settings      = merge(local.common_app_settings, local.fe_smcr_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.fe_smcr_app_settings)

  health_check_path = "/api/health"
  tags              = local.tags
}

# Nessuno startup command: App Service lancia `npm start`, che il CD riscrive
# in `node server.js` nel package.json del bundle standalone.

# =============================================================================
# Role Assignments
# =============================================================================

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
