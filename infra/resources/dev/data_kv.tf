# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-03-12 15:05
# Per aggiornare: python3 infra/scripts/generate_locals.py --env dev
# =============================================================================

data "azurerm_key_vault_secret" "auth_jwt_secret_dev" {
  name         = "auth-jwt-secret-dev"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "auth_msal_client_id_dev" {
  name         = "auth-msal-client-id-dev"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "auth_msal_tenant_id_dev" {
  name         = "auth-msal-tenant-id-dev"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_firma_con_io" {
  name         = "fe-smcr-api-key-firma-con-io"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_firma_con_io_signer_id" {
  name         = "fe-smcr-api-key-firma-con-io-signer-id"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_institution" {
  name         = "fe-smcr-api-key-institution"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_pnpg" {
  name         = "fe-smcr-api-key-pnpg"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_prod_get_users" {
  name         = "fe-smcr-api-key-prod-get-users"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_services" {
  name         = "fe-smcr-api-key-services"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_slack_call_management_hook_prod" {
  name         = "fe-smcr-api-slack-call-management-hook-prod"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_slack_call_management_hook_test" {
  name         = "fe-smcr-api-slack-call-management-hook-test"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_azure_storage_connection_string" {
  name         = "fe-smcr-azure-storage-connection-string"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_logs_endpoint" {
  name         = "pippo"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_ocp_apim_subscription_key" {
  name         = "fe-smcr-ocp-apim-subscription-key"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_ocp_apim_subscription_key_uat" {
  name         = "fe-smcr-ocp-apim-subscription-key-uat"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_onboarding_base_path_uat" {
  name         = "fe-smcr-onboarding-base-path-uat"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_plsm_d_platformsm_client_id" {
  name         = "fe-smcr-plsm-d-platformsm-client-id"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_plsm_d_platformsm_tenant_id" {
  name         = "fe-smcr-plsm-d-platformsm-tenant-id"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_call_management_hook" {
  name         = "fe-smcr-slack-call-management-hook"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_call_management_hook_prod" {
  name         = "fe-smcr-slack-call-management-hook-prod"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_call_management_hook_test" {
  name         = "fe-smcr-slack-call-management-hook-test"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_report_hook" {
  name         = "fe-smcr-slack-report-hook"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_storage_token" {
  name         = "fe-smcr-storage-token"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_users_api_key" {
  name         = "fe-smcr-users-api-key"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}

data "azurerm_key_vault_secret" "fe_smcr_webhook_manual_storage" {
  name         = "fe-smcr-webhook-manual-storage"
  key_vault_id = data.azurerm_key_vault.common_kv.id
}
