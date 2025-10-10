module "azurerm_linux_function_app" {
  source  = "pagopa-dx/azure-function-app/azurerm"
  version = "~> 3.0.0"

  environment         = var.environment
  resource_group_name = var.resource_group_name
  tags                = var.tags
  health_check_path   = var.health_check_path
  app_settings        = var.app_settings
  slot_app_settings   = var.slot_app_settings
  node_version        = var.node_version

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }
  subnet_pep_id = var.subnet_pep_id
  subnet_cidr   = var.subnet_cidr
  tier          = "l"

}
