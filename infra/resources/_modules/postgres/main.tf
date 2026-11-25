module "postgres" {
  source  = "pagopa-dx/azure-postgres-server/azurerm"
  version = "~> 6.1"

  use_case = "low_load"

  resource_group_name = var.resource_group_name

  environment = {
    prefix          = var.environment.prefix
    env_short       = var.environment.env_short
    location        = var.environment.location
    app_name        = var.app_name
    instance_number = "01"
  }
  pgbouncer_enabled = false

  subnet_pep_id                        = var.subnet_pep_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  admin_username         = var.postgres_username
  admin_password         = var.postgres_password
  admin_password_version = 1

  tags = var.tags
}
