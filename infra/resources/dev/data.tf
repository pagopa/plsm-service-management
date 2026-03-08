# =============================================================================
# Base infrastructure — created by dev-base, referenced via data sources
# =============================================================================

data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_resource_group" "common_rg" {
  name = "plsm-d-itn-common-rg-01"
}

data "azurerm_resource_group" "network_rg" {
  name = "plsm-d-itn-network-rg-01"
}

data "azurerm_virtual_network" "vnet" {
  name                = "plsm-d-itn-common-vnet-01"
  resource_group_name = data.azurerm_resource_group.network_rg.name
}

data "azurerm_subnet" "pep_snet" {
  name                 = "plsm-d-itn-pep-snet-01"
  virtual_network_name = data.azurerm_virtual_network.vnet.name
  resource_group_name  = data.azurerm_resource_group.network_rg.name
}

data "azurerm_key_vault" "common_kv" {
  name                = "plsm-d-itn-common-kv-01"
  resource_group_name = data.azurerm_resource_group.common_rg.name
}

data "azurerm_application_insights" "common" {
  name                = "plsm-d-itn-common-appi-01"
  resource_group_name = data.azurerm_resource_group.common_rg.name
}

# =============================================================================
# GitHub Managed Identities — created by dev bootstrapper
# =============================================================================

data "azurerm_user_assigned_identity" "github_cd_identity" {
  resource_group_name = "plsm-d-itn-sm-rg-01"
  name                = "plsm-d-itn-sm-app-github-cd-id-01"
}

data "azurerm_user_assigned_identity" "github_ci_identity" {
  resource_group_name = "plsm-d-itn-sm-rg-01"
  name                = "plsm-d-itn-sm-app-github-ci-id-01"
}

# =============================================================================
# Application Insights Secrets — used by Azure Functions
# =============================================================================

data "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "appinsights-connection-string"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "appinsights_instrumentationkey" {
  name         = "appinsights-instrumentation-key"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}
