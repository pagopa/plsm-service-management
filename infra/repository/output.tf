output "subscription_id" {
  value = data.azurerm_subscription.current.subscription_id
}

output "tenant_id" {
  value = data.azurerm_subscription.current.tenant_id
}
output "github_environments" {
  value = {
    for env_name, env in github_repository_environment.environments :
    env_name => env.environment
  }
  description = "Ambienti GitHub creati"
}
