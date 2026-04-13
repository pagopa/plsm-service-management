# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-04-13 09:52
# Per aggiornare: python3 infra/scripts/generate_locals.py --env dev
# =============================================================================

locals {

  # ────────────────────────────────────────────────────────────
  # auth_func
  # ────────────────────────────────────────────────────────────

  yaml_auth_func_app_settings = {
    MSAL_CLIENT_ID           = data.azurerm_key_vault_secret.auth_msal_client_id_dev.value
    MSAL_TENANT_ID           = data.azurerm_key_vault_secret.auth_msal_tenant_id_dev.value
    JWT_SECRET               = data.azurerm_key_vault_secret.auth_jwt_secret_dev.value
    JWT_EXPIRY_SECONDS       = "3600"
    JWT_ISSUER               = "plsm-auth-service-dev"
    JWT_AUDIENCE             = "plsm-fe-smcr-dev"
    NODE_ENV                 = "development"
    WEBSITE_RUN_FROM_PACKAGE = "1"
    MSAL_REDIRECT_URI        = "https://plsm-d-itn-auth-func-01.azurewebsites.net/api/v1/auth/callback"
  }

  yaml_auth_func_slot_app_settings = {
    MSAL_CLIENT_ID           = data.azurerm_key_vault_secret.auth_msal_client_id_dev.value
    MSAL_TENANT_ID           = data.azurerm_key_vault_secret.auth_msal_tenant_id_dev.value
    JWT_SECRET               = data.azurerm_key_vault_secret.auth_jwt_secret_dev.value
    JWT_EXPIRY_SECONDS       = "3600"
    JWT_ISSUER               = "plsm-auth-service-dev-staging"
    JWT_AUDIENCE             = "plsm-fe-smcr-dev-staging"
    NODE_ENV                 = "development"
    WEBSITE_RUN_FROM_PACKAGE = "1"
    MSAL_REDIRECT_URI        = "https://plsm-d-itn-auth-func-01-staging.azurewebsites.net/api/v1/auth/callback"
  }

  # ────────────────────────────────────────────────────────────
  # fe_smcr
  # ────────────────────────────────────────────────────────────

  yaml_fe_smcr_app_settings = {
    FE_SMCR_LOGS_ENDPOINT                                 = data.azurerm_key_vault_secret.fe_smcr_logs_endpoint.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT                 = data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key_uat.value
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST           = data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_test.value
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD           = data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_prod.value
    FE_SMCR_USERS_API_KEY                                 = data.azurerm_key_vault_secret.fe_smcr_users_api_key.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY                     = data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key.value
    FE_SMCR_API_KEY_INSTITUTION                           = data.azurerm_key_vault_secret.fe_smcr_api_key_institution.value
    FE_SMCR_API_KEY_PROD_GET_USERS                        = data.azurerm_key_vault_secret.fe_smcr_api_key_prod_get_users.value
    FE_SMCR_API_KEY_SERVICES                              = data.azurerm_key_vault_secret.fe_smcr_api_key_services.value
    FE_SMCR_API_KEY_PNPG                                  = data.azurerm_key_vault_secret.fe_smcr_api_key_pnpg.value
    FE_SMCR_API_KEY_FIRMA_CON_IO                          = data.azurerm_key_vault_secret.fe_smcr_api_key_firma_con_io.value
    FE_SMCR_SLACK_REPORT_HOOK                             = data.azurerm_key_vault_secret.fe_smcr_slack_report_hook.value
    FE_SMCR_SLACK_CALL_MANAGEMENT_HOOK                    = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook.value
    FE_SMCR_AZURE_STORAGE_CONNECTION_STRING               = data.azurerm_key_vault_secret.fe_smcr_azure_storage_connection_string.value
    FE_SMCR_API_KEY_FIRMA_CON_IO_SIGNER_ID                = data.azurerm_key_vault_secret.fe_smcr_api_key_firma_con_io_signer_id.value
    FE_SMCR_API_KEY_CERTIFICATI                           = data.azurerm_key_vault_secret.fe_smcr_api_key_certificati.value
    WEBHOOK_MANUAL_STORAGE                                = data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value
    STORAGE_TOKEN                                         = data.azurerm_key_vault_secret.fe_smcr_storage_token.value
    SLACK_CALL_MANAGEMENT_HOOK_TEST                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value
    SLACK_CALL_MANAGEMENT_HOOK_PROD                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value
    ONBOARDING_BASE_PATH_UAT                              = data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value
    FE_SMCR_CRM_API_URL                                   = data.azurerm_key_vault_secret.fe_smcr_crm_api_url.value
    FE_SMCR_CRM_API_KEY                                   = data.azurerm_key_vault_secret.fe_smcr_crm_api_key.value
    NEXT_PUBLIC_MSAL_CLIENT_ID                            = data.azurerm_key_vault_secret.fe_smcr_plsm_d_platformsm_client_id.value
    NEXT_PUBLIC_MSAL_TENANT_ID                            = data.azurerm_key_vault_secret.fe_smcr_plsm_d_platformsm_tenant_id.value
    DB_HOST                                               = azurerm_key_vault_secret.db_host.value
    DB_USER                                               = azurerm_key_vault_secret.postgres_username.value
    DB_PASSWORD_B64                                       = azurerm_key_vault_secret.db_password_b64.value
    FE_SMCR_AZURE_STORAGE_CONTAINER                       = "selfcare"
    FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX = "Selfcare_onboarding_mensili_"
    DB_NAME                                               = "dbsmcr"
    DB_TABLE                                              = "dbsmcr"
    DB_PORT                                               = "5432"
    DB_SSL                                                = "true"
    GET_INFOCAMERE                                        = "external/internal/v1/infocamere-pdnd/institution/"
    GET_INSTITUTION                                       = "external/support/v1/institutions"
    GET_IPA                                               = "external/internal/v1/institutions/"
    GET_IPA_UO                                            = "external/internal/v1/uo/"
    GET_IPA_AOO                                           = "external/internal/v1/aoo/"
    GET_STATUS                                            = "external/support/v1/onboarding/institutionOnboardings"
    GET_USERS_PATH                                        = "external/v2/users"
    ONBOARDING_BASE_PATH                                  = "https://api.selfcare.pagopa.it/"
    UPLOAD                                                = "external/internal/v1/onboarding/"
    TEST_ENDPOINT                                         = "mytestendpoint"
    NEXT_PUBLIC_APP_URL                                   = "https://plsm-d-itn-fe-smcr-app-01.azurewebsites.net"
    NEXT_PUBLIC_MSAL_REDIRECT_URI                         = "https://plsm-d-itn-fe-smcr-app-01.azurewebsites.net/api/auth/callback/microsoft"
    NEXT_PUBLIC_POST_LOGIN_REDIRECT                       = "https://plsm-d-itn-fe-smcr-app-01.azurewebsites.net"
  }

  yaml_fe_smcr_slot_app_settings = {
    FE_SMCR_LOGS_ENDPOINT                                 = data.azurerm_key_vault_secret.fe_smcr_logs_endpoint.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT                 = data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key_uat.value
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST           = data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_test.value
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD           = data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_prod.value
    FE_SMCR_USERS_API_KEY                                 = data.azurerm_key_vault_secret.fe_smcr_users_api_key.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY                     = data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key.value
    FE_SMCR_API_KEY_INSTITUTION                           = data.azurerm_key_vault_secret.fe_smcr_api_key_institution.value
    FE_SMCR_API_KEY_PROD_GET_USERS                        = data.azurerm_key_vault_secret.fe_smcr_api_key_prod_get_users.value
    FE_SMCR_API_KEY_SERVICES                              = data.azurerm_key_vault_secret.fe_smcr_api_key_services.value
    FE_SMCR_API_KEY_PNPG                                  = data.azurerm_key_vault_secret.fe_smcr_api_key_pnpg.value
    FE_SMCR_API_KEY_FIRMA_CON_IO                          = data.azurerm_key_vault_secret.fe_smcr_api_key_firma_con_io.value
    FE_SMCR_SLACK_REPORT_HOOK                             = data.azurerm_key_vault_secret.fe_smcr_slack_report_hook.value
    FE_SMCR_SLACK_CALL_MANAGEMENT_HOOK                    = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook.value
    FE_SMCR_AZURE_STORAGE_CONNECTION_STRING               = data.azurerm_key_vault_secret.fe_smcr_azure_storage_connection_string.value
    FE_SMCR_API_KEY_FIRMA_CON_IO_SIGNER_ID                = data.azurerm_key_vault_secret.fe_smcr_api_key_firma_con_io_signer_id.value
    FE_SMCR_API_KEY_CERTIFICATI                           = data.azurerm_key_vault_secret.fe_smcr_api_key_certificati.value
    WEBHOOK_MANUAL_STORAGE                                = data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value
    STORAGE_TOKEN                                         = data.azurerm_key_vault_secret.fe_smcr_storage_token.value
    SLACK_CALL_MANAGEMENT_HOOK_TEST                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value
    SLACK_CALL_MANAGEMENT_HOOK_PROD                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value
    ONBOARDING_BASE_PATH_UAT                              = data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value
    FE_SMCR_CRM_API_URL                                   = data.azurerm_key_vault_secret.fe_smcr_crm_api_url.value
    FE_SMCR_CRM_API_KEY                                   = data.azurerm_key_vault_secret.fe_smcr_crm_api_key.value
    NEXT_PUBLIC_MSAL_CLIENT_ID                            = data.azurerm_key_vault_secret.fe_smcr_plsm_d_platformsm_client_id.value
    NEXT_PUBLIC_MSAL_TENANT_ID                            = data.azurerm_key_vault_secret.fe_smcr_plsm_d_platformsm_tenant_id.value
    DB_HOST                                               = azurerm_key_vault_secret.db_host.value
    DB_USER                                               = azurerm_key_vault_secret.postgres_username.value
    DB_PASSWORD_B64                                       = azurerm_key_vault_secret.db_password_b64.value
    FE_SMCR_AZURE_STORAGE_CONTAINER                       = "selfcare"
    FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX = "Selfcare_onboarding_mensili_"
    DB_NAME                                               = "dbsmcr"
    DB_TABLE                                              = "dbsmcr"
    DB_PORT                                               = "5432"
    DB_SSL                                                = "true"
    GET_INFOCAMERE                                        = "external/internal/v1/infocamere-pdnd/institution/"
    GET_INSTITUTION                                       = "external/support/v1/institutions"
    GET_IPA                                               = "external/internal/v1/institutions/"
    GET_IPA_UO                                            = "external/internal/v1/uo/"
    GET_IPA_AOO                                           = "external/internal/v1/aoo/"
    GET_STATUS                                            = "external/support/v1/onboarding/institutionOnboardings"
    GET_USERS_PATH                                        = "external/v2/users"
    ONBOARDING_BASE_PATH                                  = "https://api.selfcare.pagopa.it/"
    UPLOAD                                                = "external/internal/v1/onboarding/"
    TEST_ENDPOINT                                         = "mytestendpoint"
    NEXT_PUBLIC_APP_URL                                   = "https://plsm-d-itn-fe-smcr-app-01-staging.azurewebsites.net"
    NEXT_PUBLIC_MSAL_REDIRECT_URI                         = "https://plsm-d-itn-fe-smcr-app-01-staging.azurewebsites.net/api/auth/callback/microsoft"
    NEXT_PUBLIC_POST_LOGIN_REDIRECT                       = "https://plsm-d-itn-fe-smcr-app-01-staging.azurewebsites.net"
  }

  # ────────────────────────────────────────────────────────────────
  # Metadati ambiente
  # ────────────────────────────────────────────────────────────────

  yaml_environment = {
    prefix          = "plsm"
    env_short       = "d"
    location        = "italynorth"
    instance_number = "01"
  }

  yaml_tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Dev"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }
}
