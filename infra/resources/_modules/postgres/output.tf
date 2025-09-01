output "postgres" {
  description = "Details of the PostgreSQL Flexible Server, including its name, ID, and resource group name."
  value = {
    name                = module.postgres
    id                  = module.postgres
    resource_group_name = module.postgres
  }
}
