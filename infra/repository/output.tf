output "subscription_id" {
  value = data.azurerm_subscription.current.subscription_id
}

output "tenant_id" {
  value = data.azurerm_subscription.current.tenant_id
}

output "ci_identity_client_id" {
  value       = module.azure_federated_identity_with_github.federated_ci_identity
  description = "Client ID for GitHub CI workflows"
  sensitive   = true
}

output "cd_identity_client_id" {
  value       = module.azure_federated_identity_with_github.federated_cd_identity
  description = "Client ID for GitHub CD workflows"
  sensitive   = true
}

output "github_environments" {
  value = {
    infra-dev-ci  = github_repository_environment.github_repository_environment_dev_ci.environment
    infra-dev-cd  = github_repository_environment.github_repository_environment_dev_cd.environment
    infra-prod-ci = github_repository_environment.github_repository_environment_prod_ci.environment
    infra-prod-cd = github_repository_environment.github_repository_environment_prod_cd.environment
    app-dev-ci    = github_repository_environment.app_dev_ci.environment
    app-dev-cd    = github_repository_environment.app_dev_cd.environment
    app-prod-ci   = github_repository_environment.app_prod_ci.environment
    app-prod-cd   = github_repository_environment.app_prod_cd.environment
  }
  description = "Created GitHub environments"
}
