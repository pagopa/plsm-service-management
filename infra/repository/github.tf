resource "github_actions_secret" "repo_variables" {
  for_each = local.repo_secrets

  repository     = local.repository.name
  secret_name     = each.key
  plaintext_value = each.value
}