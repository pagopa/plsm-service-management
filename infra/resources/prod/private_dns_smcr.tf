# =============================================================================
# Private DNS Zone - smcr.pagopa.it (VPN-only access)
# =============================================================================

resource "azurerm_private_dns_zone" "smcr_pagopa_it" {
  count               = local.enable_smcr_custom_domain ? 1 : 0
  name                = "smcr.pagopa.it"
  resource_group_name = module.azure_core_infra.common_resource_group_name
  tags                = local.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "smcr_pagopa_it" {
  count                 = local.enable_smcr_custom_domain ? 1 : 0
  name                  = module.azure_core_infra.common_vnet.name
  resource_group_name   = module.azure_core_infra.common_resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.smcr_pagopa_it[0].name
  virtual_network_id    = module.azure_core_infra.common_vnet.id
  registration_enabled  = false
  tags                  = local.tags
}

resource "azurerm_private_dns_a_record" "smcr_pagopa_it_apex" {
  count               = local.enable_smcr_custom_domain ? 1 : 0
  name                = "@"
  zone_name           = azurerm_private_dns_zone.smcr_pagopa_it[0].name
  resource_group_name = module.azure_core_infra.common_resource_group_name
  ttl                 = local.dns_default_ttl_sec
  records             = [module.azure_fe_app_service_smcr.app_service.app_service.pep_record_sets[0].ip_addresses[0]]
  tags                = local.tags
}
