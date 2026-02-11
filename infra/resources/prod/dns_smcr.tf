# =============================================================================
# Public DNS Zone - smcr.pagopa.it
# =============================================================================

resource "azurerm_dns_zone" "smcr_pagopa_it" {
  name                = "smcr.pagopa.it"
  resource_group_name = module.azure_core_infra.common_resource_group_name
  tags                = local.tags
}

output "smcr_pagopa_it_name_servers" {
  value = azurerm_dns_zone.smcr_pagopa_it.name_servers
}
