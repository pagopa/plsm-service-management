output "subscription_id" {
  value = data.azurerm_subscription.current.subscription_id
}

output "tenant_id" {
  value = data.azurerm_subscription.current.tenant_id
}

output "infra_ci_identity" {
  value       = module.infra_federated_identity.federated_ci_identity
  description = "Identità per CI infrastruttura"
  sensitive   = true
}

output "infra_cd_identity" {
  value       = module.infra_federated_identity.federated_cd_identity
  description = "Identità per CD infrastruttura"
  sensitive   = true
}

output "app_ci_identity" {
  value       = module.app_federated_identity.federated_ci_identity
  description = "Identità per CI/DEV applicazioni"
  sensitive   = true
}

output "app_cd_identity" {
  value       = module.app_federated_identity.federated_cd_identity
  description = "Identità per CD/PROD applicazioni"
  sensitive   = true
}

output "github_environments" {
  value = {
    for env_name, env in github_repository_environment.environments :
    env_name => env.environment
  }
  description = "Ambienti GitHub creati"
}