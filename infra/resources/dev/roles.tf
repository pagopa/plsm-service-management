# =============================================================================
# Role Assignments — GitHub Actions Identities (DEV)
# =============================================================================

# Permesso per la CI sul Resource Group delle Function App
resource "azurerm_role_assignment" "ci_func_contributor" {
  scope                = data.azurerm_resource_group.apps_rg.id
  role_definition_name = "Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id
}

# Permesso per la CD sul Resource Group delle Function App
resource "azurerm_role_assignment" "cd_func_contributor" {
  scope                = data.azurerm_resource_group.apps_rg.id
  role_definition_name = "Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
}
