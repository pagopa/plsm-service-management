output "subscription_id" {
  value = data.azurerm_subscription.current.subscription_id
}

output "tenant_id" {
  value = data.azurerm_subscription.current.tenant_id
}

output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "infra_ci_identity" {
  value       = module.infra_federated_identity.ci_identity
  description = "Identità per CI infrastruttura"
  sensitive   = false
}

output "infra_cd_identity" {
  value       = module.infra_federated_identity.cd_identity
  description = "Identità per CD infrastruttura"
  sensitive   = false
}

output "app_ci_identity" {
  value       = module.app_federated_identity.ci_identity
  description = "Identità per CI App"
  sensitive   = false
}

output "app_cd_identity" {
  value       = module.app_federated_identity.cd_identity
  description = "Identità per CD App"
  sensitive   = false
}

