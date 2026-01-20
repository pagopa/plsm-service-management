# =============================================================================
# Storage Accounts
# =============================================================================

resource "azurerm_storage_account" "storage_marco_ext_001" {
  name                     = "plsmpitmarcoext001"
  resource_group_name      = azurerm_resource_group.ext_rg.name
  location                 = azurerm_resource_group.ext_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    environment = "production"
  }
}