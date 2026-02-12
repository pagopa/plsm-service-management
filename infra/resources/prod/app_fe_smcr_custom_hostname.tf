# =============================================================================
# Custom Hostname Binding - smcr.pagopa.it
# =============================================================================

resource "azurerm_app_service_custom_hostname_binding" "smcr_pagopa_it" {
  count               = local.enable_smcr_custom_domain ? 1 : 0
  hostname            = "smcr.pagopa.it"
  app_service_name    = "plsm-p-itn-fe-smcr-app-01"
  resource_group_name = azurerm_resource_group.apps_rg.name

  depends_on = [
    module.azure_fe_app_service_smcr,
    azurerm_private_dns_zone.smcr_pagopa_it,
    azurerm_private_dns_a_record.smcr_pagopa_it_apex
  ]
}

resource "azurerm_app_service_managed_certificate" "smcr_pagopa_it" {
  count                      = local.enable_smcr_custom_domain ? 1 : 0
  custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.smcr_pagopa_it[0].id
}

resource "azurerm_app_service_certificate_binding" "smcr_pagopa_it" {
  count               = local.enable_smcr_custom_domain ? 1 : 0
  hostname_binding_id = azurerm_app_service_custom_hostname_binding.smcr_pagopa_it[0].id
  certificate_id      = azurerm_app_service_managed_certificate.smcr_pagopa_it[0].id
  ssl_state           = "SniEnabled"
}
