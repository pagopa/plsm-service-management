resource "dx_available_subnet_cidr" "app_service_subnet_cidr" {
  virtual_network_id = data.azurerm_virtual_network.vnet.id
  prefix_length      = 24
}

resource "dx_available_subnet_cidr" "auth_fa_subnet_cidr" {
  virtual_network_id = data.azurerm_virtual_network.vnet.id
  prefix_length      = 27 # /27 = 32 IPs
  depends_on = [
    dx_available_subnet_cidr.app_service_subnet_cidr
  ]
}
