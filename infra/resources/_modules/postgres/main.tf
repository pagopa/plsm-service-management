module "postgres" {
  source  = "pagopa-dx/azure-postgres-server/azurerm"
  version = "~> 2.0.0"

  resource_group_name = var.resource_group_name

  environment = {
    prefix          = var.environment.prefix
    env_short       = var.environment.env_short
    location        = var.environment.location
    app_name        = var.app_name
    instance_number = "01"
  }
  pgbouncer_enabled = false
  create_replica    = false
  # replica_location           = "Italy North"
  high_availability_override = false

  subnet_pep_id                        = var.subnet_pep_id
  private_dns_zone_resource_group_name = var.private_dns_zone_resource_group_name

  administrator_credentials = {
    name     = var.postgres_username
    password = var.postgres_password
  }

  tags = var.tags
}
