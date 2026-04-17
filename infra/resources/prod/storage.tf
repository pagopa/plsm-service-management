# =============================================================================
# Storage Accounts
# =============================================================================

resource "azurerm_storage_account" "storage_marco_ext_001" {
  name                     = "plsmpitmarcoext001"
  resource_group_name      = azurerm_resource_group.ext_rg.name
  location                 = azurerm_resource_group.ext_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = local.tags
}

resource "azurerm_storage_account" "diagnostics_storage" {
  name                     = "plsmpitdiagst001"
  resource_group_name      = azurerm_resource_group.fn_rg.name
  location                 = azurerm_resource_group.fn_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = local.tags
}

resource "azurerm_storage_container" "crm_diagnostics" {
  name                  = "crm-diagnostics"
  storage_account_id    = azurerm_storage_account.diagnostics_storage.id
  container_access_type = "private"
}
