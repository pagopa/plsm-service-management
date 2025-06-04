resource "github_actions_secret" "repo_variables" {
  for_each = local.repo_secrets

  repository      = local.repository.name
  secret_name     = each.key
  plaintext_value = each.value
}

# Creazione dinamica degli ambienti
resource "github_repository_environment" "environments" {
  for_each = local.environments

  environment = each.key
  repository  = local.repository.name

  # Branch protection solo per infra-cd e prod
  dynamic "deployment_branch_policy" {
    for_each = each.value.protected_branches ? [1] : []
    content {
      protected_branches     = true
      custom_branch_policies = false
    }
  }
}

# Variabili per ogni ambiente
resource "github_actions_environment_variable" "env_variables" {
  for_each = merge([
    for env_name, env_config in local.environments : {
      for var_name, var_value in env_config.variables :
      "${env_name}-${var_name}" => {
        environment   = env_name
        variable_name = var_name
        value         = var_value
      }
    }
  ]...)

  repository    = local.repository.name
  environment   = github_repository_environment.environments[each.value.environment].environment
  variable_name = each.value.variable_name
  value         = each.value.value
}

# Secrets per ogni ambiente
resource "github_actions_environment_secret" "env_secrets" {
  for_each = merge([
    for env_name, env_config in local.environments : {
      for secret_name, secret_value in env_config.secrets :
      "${env_name}-${secret_name}" => {
        environment     = env_name
        secret_name     = secret_name
        plaintext_value = secret_value
      }
    }
  ]...)

  repository      = local.repository.name
  environment     = github_repository_environment.environments[each.value.environment].environment
  secret_name     = each.value.secret_name
  plaintext_value = each.value.plaintext_value
}
