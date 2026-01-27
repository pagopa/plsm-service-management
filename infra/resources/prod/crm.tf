# =============================================================================
# IDENTITY CRM - Azure Function
# =============================================================================

resource "azurerm_role_assignment" "cd_identity_website_contrib_crm_fa" {
  scope                = module.crm_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
  depends_on           = [module.crm_function]
}

# =============================================================================
# CRM - Azure Function
# =============================================================================


module "crm_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "crm",
    instance_number = "01"
  })

  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.network_resource_group_name
  }
  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.crm_fa_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.crm_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.crm_func_slot_app_settings)

  depends_on = [module.azure_core_infra]
}
