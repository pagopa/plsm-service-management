# =============================================================================
# Role Assignments — GitHub Actions infra identities on the common Key Vault
# Equivalent of prod/roles.tf; both assignments were created by hand
# and are adopted into state with the import blocks below.
# =============================================================================

# Permesso per la CI sul Key Vault: solo lettura, basta per il refresh dei segreti in plan
# (in prod la CI ha Secrets Officer, più del necessario)
resource "azurerm_role_assignment" "kv_ci_secrets_user_infra" {
  scope                = module.azure_core_infra.common_key_vault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity_infra.principal_id
}

# Permesso per la CD sul Key Vault
resource "azurerm_role_assignment" "kv_cd_secrets_officer_infra" {
  scope                = module.azure_core_infra.common_key_vault.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity_infra.principal_id
}

# Assegnazioni create a mano (CI il 2026-10-06, CD il 2026-03-06)
import {
  to = azurerm_role_assignment.kv_ci_secrets_user_infra
  id = "${module.azure_core_infra.common_key_vault.id}/providers/Microsoft.Authorization/roleAssignments/55793205-06a4-482f-8272-639d12474bac"
}

import {
  to = azurerm_role_assignment.kv_cd_secrets_officer_infra
  id = "${module.azure_core_infra.common_key_vault.id}/providers/Microsoft.Authorization/roleAssignments/aa102481-a5c2-4dc5-9f66-3161224a9d61"
}
