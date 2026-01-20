# =============================================================================
# Onboarding - Azure Function
# =============================================================================

module "onboarding_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "onboarding",
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
  subnet_cidr   = dx_available_subnet_cidr.onboarding_fa_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.onboarding_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.onboarding_slot_func_app_settings)

  depends_on = [module.azure_core_infra]
}

# -----------------------------------------------------------------------------
# Private Endpoint - EventHub SELC (Cross-Subscription)
# -----------------------------------------------------------------------------

resource "azurerm_private_endpoint" "onboarding_func_to_selc_eventhub" {
  name                = "plsm-p-itn-selc-evhns-pep-01"
  location            = "Italy North"
  resource_group_name = "plsm-p-itn-network-rg-01"

  subnet_id = "/subscriptions/c703d239-22b7-4d1a-9433-145daa884c10/resourceGroups/plsm-p-itn-network-rg-01/providers/Microsoft.Network/virtualNetworks/plsm-p-itn-common-vnet-01/subnets/plsm-p-itn-pep-snet-01"

  private_service_connection {
    name                           = "plsm-p-itn-selc-evhns-psc-01"
    private_connection_resource_id = "/subscriptions/${var.eventhub_subscription_id}/resourceGroups/selc-p-event-rg/providers/Microsoft.EventHub/namespaces/selc-p-eventhub-ns"
    is_manual_connection           = true
    request_message                = "Connessione da Azure Function 'plsm-p-itn-onboarding-func-01' per Onboarding"
    subresource_names              = ["namespace"]
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = ["/subscriptions/${var.subscription_id}/resourceGroups/plsm-p-itn-network-rg-01/providers/Microsoft.Network/privateDnsZones/privatelink.servicebus.windows.net"]
  }
}

# -----------------------------------------------------------------------------
# Role Assignments
# -----------------------------------------------------------------------------

resource "azurerm_role_assignment" "cd_identity_website_contrib_onboardng_fa" {
  scope                = module.onboarding_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id

  depends_on = [module.onboarding_function]
}