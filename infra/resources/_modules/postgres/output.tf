output "postgres" {
  description = "Details of the PostgreSQL Flexible Server, including its name, ID, and resource group name."
  value = {
    name                = module.postgres.postgres.name
    id                  = module.postgres.postgres.id
    resource_group_name = module.postgres.postgres.resource_group_name
  }
}
