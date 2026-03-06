# =============================================================================
# Core Infrastructure (always-on base resources)
# VNet, Key Vault, Application Insights, Resource Groups
# =============================================================================

module "azure_core_infra" {
  source  = "pagopa-dx/azure-core-infra/azurerm"
  version = "2.2.1"

  environment = merge(local.environment, {
    app_name        = "smcr"
    instance_number = "01"
  })

  nat_enabled  = false
  vpn_enabled  = true
  test_enabled = false

  tags = local.tags
}

# Creato qui (non in dev/) così esiste sempre e il bootstrapper può assegnarci i permessi
resource "azurerm_resource_group" "apps_rg" {
  name     = "plsm-d-itn-apps-rg-01"
  location = "Italy North"
  tags     = local.tags
}
