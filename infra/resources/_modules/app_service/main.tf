

module "azure_app_service" {
  source  = "pagopa-dx/azure-app-service/azurerm"
  version = "~> 1.0.1"


  environment = {
    prefix          = var.environment.prefix
    env_short       = var.environment.env_short
    location        = var.environment.location
    domain          = "pg" # var.environment.domain
    app_name        = var.environment.app_name
    instance_number = var.environment.instance_number
  }

  tier                = var.tier
  resource_group_name = var.resource_group_name

  virtual_network = {
    name                = var.virtual_network.name
    resource_group_name = var.virtual_network.resource_group_name
  }
  subnet_pep_id = var.subnet_pep_id
  subnet_cidr   = var.subnet_cidr

  app_settings      = var.app_settings
  slot_app_settings = var.slot_app_settings

  health_check_path = var.health_check_path
  tags              = var.tags

}
