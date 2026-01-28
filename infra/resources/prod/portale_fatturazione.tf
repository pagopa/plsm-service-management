# =============================================================================
# Portale Fatturazione - Azure Function
# =============================================================================

module "portalefatturazione_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "pfatt",
    instance_number = "01"
  })

  application_insights_connection_string = data.azurerm_key_vault_secret.appinsights_connection_string.value
  application_insights_key               = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value

  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.network_resource_group_name
  }

  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.pf_fa_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.pf_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.pf_slot_app_settings)

  depends_on = [module.azure_core_infra]
}

# -----------------------------------------------------------------------------
# Private Endpoint - Storage Account 'fatppublic' (Cross-Subscription)
# -----------------------------------------------------------------------------

resource "azurerm_private_endpoint" "fatppublic_storage_pep" {
  name                = "plsm-p-itn-fatpublic-storage-pep"
  location            = azurerm_resource_group.fn_rg.location
  resource_group_name = azurerm_resource_group.fn_rg.name

  subnet_id = module.azure_core_infra.common_pep_snet.id

  tags = local.tags

  private_service_connection {
    name                           = "fatppublic-storage-psc"
    private_connection_resource_id = var.storage_account_fatppublic_id
    is_manual_connection           = true
    subresource_names              = ["blob"]
    request_message                = "Richiesta di Private Link per la Function App 'Funzione FAT Public'"
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.existing_storage_blob_dns_zone.id]
  }

  depends_on = [module.azure_core_infra]
}

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

resource "azurerm_role_assignment" "pfatt_container_contributor" {
  scope                = var.container_pf
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = module.portalefatturazione_function.function_app_principal_id

  depends_on = [module.portalefatturazione_function]
}

resource "azurerm_role_assignment" "cd_identity_website_contrib_pf_fa" {
  scope                = module.portalefatturazione_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id

  depends_on = [module.portalefatturazione_function]
}