# Permesso per la CI sul Resource Group delle Function
resource "azurerm_role_assignment" "ci_func_contributor" {
  scope                = "/subscriptions/${data.azurerm_key_vault_secret.tf_subscription_id.value}/resourceGroups/plsm-p-itn-fn-rg-01"
  role_definition_name = "Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id
}

# Permesso per la CD sul Resource Group delle Function
resource "azurerm_role_assignment" "cd_func_contributor" {
  scope                = "/subscriptions/${data.azurerm_key_vault_secret.tf_subscription_id.value}/resourceGroups/plsm-p-itn-fn-rg-01"
  role_definition_name = "Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
}


# Permesso per la CI sul Resource Group delle Function
resource "azurerm_role_assignment" "ci_func_contributor_infra" {
  scope                = "/subscriptions/${data.azurerm_key_vault_secret.tf_subscription_id.value}/resourceGroups/plsm-p-itn-fn-rg-01"
  role_definition_name = "Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity_infra.principal_id
}

# Permesso per la CD sul Resource Group delle Function
resource "azurerm_role_assignment" "cd_func_contributor_infra" {
  scope                = "/subscriptions/${data.azurerm_key_vault_secret.tf_subscription_id.value}/resourceGroups/plsm-p-itn-fn-rg-01"
  role_definition_name = "Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity_infra.principal_id
}