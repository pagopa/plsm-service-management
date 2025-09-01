module "postgres" {
  source  = "pagopa-dx/azure-postgres-server/azurerm"
  version = "~> 1.0.7"

  resource_group_name = var.resource_group_name

  environment = {
    prefix          = var.environment.prefix
    env_short       = var.environment.env_short
    location        = var.environment.location
    app_name        = var.environment.domain
    instance_number = "01"
  }
  pgbouncer_enabled = false

  subnet_pep_id                        = var.subnet_pep_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  administrator_credentials = {
    name     = var.postgres_username
    password = var.postgres_password
  }

  tags = var.tags
}
