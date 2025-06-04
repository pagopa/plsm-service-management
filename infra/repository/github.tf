resource "github_actions_secret" "repo_variables" {
  for_each = local.repo_secrets

  repository      = local.repository.name
  secret_name     = each.key
  plaintext_value = each.value
}

# Ambiente per deploy Infrastruttura DEV CI: infra-dev-ci

resource "github_repository_environment" "github_repository_environment_dev_ci" {
  environment = "infra-dev-ci"
  repository  = local.repository.name
}

# Impostazione variabili Infrastruttura DEV CI

resource "github_actions_environment_variable" "env_dev_ci_variables" {
  for_each = local.dev.ci.variables

  repository    = local.repository.name
  environment   = github_repository_environment.github_repository_environment_dev_ci.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura DEV CI

resource "github_actions_environment_secret" "env_dev_ci_secrets" {
  for_each = local.dev.ci.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.github_repository_environment_dev_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# Ambiente per deploy Infrastruttura DEV CD infra-dev-cd

resource "github_repository_environment" "github_repository_environment_dev_cd" {
  environment = "infra-dev-cd"
  repository  = local.repository.name
}

# Impostazione variabili Infrastruttura DEV CD

resource "github_actions_environment_variable" "env_dev_cd_variables" {
  for_each = local.dev.cd.variables

  repository    = local.repository.name
  environment   = github_repository_environment.github_repository_environment_dev_cd.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura DEV CD

resource "github_actions_environment_secret" "env_dev_cd_secrets" {
  for_each = local.dev.cd.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.github_repository_environment_dev_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# Ambiente per deploy Infrastruttura PROD CI infra-dev-ci

resource "github_repository_environment" "github_repository_environment_prod_ci" {
  environment = "infra-prod-ci"
  repository  = local.repository.name
}

# Impostazione variabili Infrastruttura PROD CI

resource "github_actions_environment_variable" "env_prod_ci_variables" {
  for_each = local.prod.ci.variables

  repository    = local.repository.name
  environment   = github_repository_environment.github_repository_environment_prod_ci.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura PROD CI

resource "github_actions_environment_secret" "env_prod_ci_secrets" {
  for_each = local.prod.ci.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.github_repository_environment_prod_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# Ambiente per deploy Infrastruttura PROD CD infra-prod-cd

resource "github_repository_environment" "github_repository_environment_prod_cd" {
  environment = "infra-prod-cd"
  repository  = local.repository.name
}

# Impostazione variabili Infrastruttura PROD CD

resource "github_actions_environment_variable" "env_prod_cd_variables" {
  for_each = local.prod.cd.variables

  repository    = local.repository.name
  environment   = github_repository_environment.github_repository_environment_prod_cd.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura PROD CD

resource "github_actions_environment_secret" "env_prod_cd_secrets" {
  for_each = local.prod.cd.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.github_repository_environment_prod_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}


# Ambiente per deploy applicativo DEV CI
resource "github_repository_environment" "app_dev_ci" {
  environment = "dev-ci"
  repository  = local.repository.name
}

# Impostazione variabili Infrastruttura APP DEV CI

resource "github_actions_environment_variable" "app_env_dev_ci_variables" {
  for_each = local.dev.app-ci.variables

  repository    = local.repository.name
  environment   = github_repository_environment.app_dev_ci.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura APP DEV CI

resource "github_actions_environment_secret" "app_env_dev_ci_secrets" {
  for_each = local.dev.app-ci.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.app_dev_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# Ambiente per deploy applicativo DEV CD
resource "github_repository_environment" "app_dev_cd" {
  environment = "dev-cd"
  repository  = local.repository.name
}

# Impostazione variabili Infrastruttura APP DEV CD

resource "github_actions_environment_variable" "app_env_dev_cd_variables" {
  for_each = local.dev.app-cd.variables

  repository    = local.repository.name
  environment   = github_repository_environment.app_dev_cd.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura APP DEV CD

resource "github_actions_environment_secret" "app_env_dev_cd_secrets" {
  for_each = local.dev.app-cd.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.app_dev_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# Ambiente per deploy applicativo PROD CI
resource "github_repository_environment" "app_prod_ci" {
  environment = "prod-ci"
  repository  = local.repository.name
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = false
  }
}

# Impostazione variabili Infrastruttura APP PROD CI

resource "github_actions_environment_variable" "app_env_prod_ci_variables" {
  for_each = local.prod.app-ci.variables

  repository    = local.repository.name
  environment   = github_repository_environment.app_prod_ci.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura APP PROD CI

resource "github_actions_environment_secret" "app_env_prod_ci_secrets" {
  for_each = local.prod.app-ci.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.app_prod_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}


# Ambiente per deploy applicativo PROD CD
resource "github_repository_environment" "app_prod_cd" {
  environment = "prod-cd"
  repository  = local.repository.name
  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}

# Impostazione variabili Infrastruttura APP PROD CD

resource "github_actions_environment_variable" "app_env_prod_cd_variables" {
  for_each = local.prod.app-cd.variables

  repository    = local.repository.name
  environment   = github_repository_environment.app_prod_cd.environment
  variable_name = each.key
  value         = each.value
}

# Impostazione secrets Infrastruttura APP PROD CD

resource "github_actions_environment_secret" "app_env_prod_cd_secrets" {
  for_each = local.prod.app-cd.secrets

  repository      = local.repository.name
  environment     = github_repository_environment.app_prod_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}