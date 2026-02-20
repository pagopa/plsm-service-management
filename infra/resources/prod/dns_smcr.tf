# =============================================================================
# Public DNS Zone - smcr.pagopa.it (NS delegation only)
# =============================================================================

resource "azurerm_dns_zone" "smcr_pagopa_it" {
  name                = "smcr.pagopa.it"
  resource_group_name = module.azure_core_infra.common_resource_group_name
  tags                = local.tags
}

output "smcr_pagopa_it_name_servers" {
  value = azurerm_dns_zone.smcr_pagopa_it.name_servers
}

# A record for App Service managed certificate validation
resource "azurerm_dns_a_record" "smcr_pagopa_it_apex" {
  count               = local.enable_smcr_custom_domain ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.smcr_pagopa_it.name
  resource_group_name = module.azure_core_infra.common_resource_group_name
  ttl                 = local.dns_default_ttl_sec
  records             = ["4.232.99.4"]
  tags                = local.tags
}
