data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azuread_group" "admins" {
  display_name = local.adgroups.admins_name
}

data "azuread_group" "devs" {
  display_name = local.adgroups.devs_name
}

data "azuread_group" "externals" {
  display_name = local.adgroups.externals_name
}

data "azurerm_resource_group" "common_rg" {
  name = "plsm-d-itn-common-rg-01"
}

data "azurerm_key_vault" "common_kv" {
  name                = "plsm-d-itn-common-kv-01"
  resource_group_name = data.azurerm_resource_group.common_rg.name
}

data "azurerm_container_app_environment" "runner" {
  name                = "plsm-d-itn-github-runner-cae-01"
  resource_group_name = "plsm-d-itn-github-runner-rg-01"
}

data "azurerm_virtual_network" "vnet" {
  name                = "plsm-d-itn-common-vnet-01"
  resource_group_name = "plsm-d-itn-network-rg-01"
}

data "azurerm_resource_group" "network_rg" {
  name = "plsm-d-itn-network-rg-01"
}

data "azurerm_resource_group" "opex_rg" {
  name = "plsm-d-itn-opex-rg-01"
}

data "azurerm_resource_group" "apps_rg" {
  name = "plsm-d-itn-apps-rg-01"
}
