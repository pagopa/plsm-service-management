resource "dx_available_subnet_cidr" "app_service_subnet_cidr" {
  virtual_network_id = data.azurerm_virtual_network.vnet.id
  prefix_length      = 24
}
