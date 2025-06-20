
module "infra_federated_identity" {
  source = "../_modules/federated_identity"

  environment = {
    prefix          = local.environment.prefix
    env_short       = local.environment.env_short
    location        = local.environment.location
    location_short  = local.environment.location_short
    domain          = local.environment.domain
    instance_number = "01"
  }

  resource_group_name = azurerm_resource_group.rg.name
  subscription_id     = data.azurerm_subscription.current.id

  repository = local.repository

  identity_type = "infra"

  tags       = local.tags
  depends_on = [azurerm_resource_group.rg]
}

module "app_federated_identity" {
  source = "../_modules/federated_identity"

  environment = {
    prefix          = local.environment.prefix
    env_short       = local.environment.env_short
    location        = local.environment.location
    location_short  = local.environment.location_short
    domain          = local.environment.domain
    instance_number = "01"
  }

  resource_group_name = azurerm_resource_group.rg.name
  subscription_id     = data.azurerm_subscription.current.id

  repository = local.repository

  identity_type = "app"

  tags       = local.tags
  depends_on = [azurerm_resource_group.rg]
}
