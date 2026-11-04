module "azurerm_linux_function_app_exposed" {
  source  = "pagopa-dx/azure-function-app-exposed/azurerm"
  version = "~> 6.0"

  environment         = var.environment
  resource_group_name = var.resource_group_name
  tags                = var.tags
  health_check_path   = var.health_check_path
  app_settings        = var.app_settings
  slot_app_settings   = var.slot_app_settings
  node_version        = var.node_version


  use_case = "default"

}
