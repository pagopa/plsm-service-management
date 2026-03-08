# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-03-08 13:40
# Per aggiornare: python3 infra/scripts/generate_locals.py
# =============================================================================

locals {

  # ────────────────────────────────────────────────────────────
  # common_app_settings
  # ────────────────────────────────────────────────────────────

  yaml_common_app_settings = {
    DiagnosticServices_EXTENSION_VERSION            = "~3"
    InstrumentationEngine_EXTENSION_VERSION         = "disabled"
    SnapshotDebugger_EXTENSION_VERSION              = "disabled"
    XDT_MicrosoftApplicationInsights_BaseExtensions = "disabled"
    XDT_MicrosoftApplicationInsights_Mode           = "recommended"
    XDT_MicrosoftApplicationInsights_PreemptSdk     = "disabled"
    TIMEOUT_DELAY                                   = "300"
  }

  yaml_common_slot_app_settings = local.yaml_common_app_settings

  # ────────────────────────────────────────────────────────────
  # certificates
  # ────────────────────────────────────────────────────────────

  yaml_certificates_func_app_settings = {
    DB_NAME     = "certificates"
    DB_TABLE    = "certificates"
    DB_PORT     = "5432"
    DB_SSL      = "true"
    DB_HOST     = data.azurerm_key_vault_secret.db_host.value
    DB_USER     = data.azurerm_key_vault_secret.db_user.value
    DB_PASSWORD = data.azurerm_key_vault_secret.db_password.value
  }

  yaml_certificates_func_slot_app_settings = local.yaml_certificates_func_app_settings

  # ────────────────────────────────────────────────────────────
  # onboarding
  # ────────────────────────────────────────────────────────────

  yaml_onboarding_func_app_settings = {
    CONTRACTS_TOPIC_CONSUMER_GROUP        = "$Default"
    CONTRACTS_TOPIC_NAME                  = "sc-contracts"
    ENDPOINT_GET_INSTITUTION_FROM_TAXCODE = "https://api.selfcare.pagopa.it/external/v2/institutions/?taxCode="
    CONTRACTS_CONSUMER_CONNECTION_STRING  = data.azurerm_key_vault_secret.sc_contracts_conn_string.value
    SLACK_WEBHOOK_LOG                     = data.azurerm_key_vault_secret.slack_webhook_log.value
    SLACK_WEBHOOK_ONBOARDING_IO           = data.azurerm_key_vault_secret.slack_webhook_onboarding_io.value
    SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM   = data.azurerm_key_vault_secret.slack_webhook_onboarding_io_premium.value
    SLACK_WEBHOOK_ONBOARDING_PN           = data.azurerm_key_vault_secret.slack_webhook_onboarding_pn.value
    SLACK_WEBHOOK_ONBOARDING_INTEROP      = data.azurerm_key_vault_secret.slack_webhook_onboarding_interop.value
    SLACK_WEBHOOK_ONBOARDING_PAGOPA       = data.azurerm_key_vault_secret.slack_webhook_onboarding_pagopa.value
    OCP_APIM_SUBSCRIPTION_KEY             = data.azurerm_key_vault_secret.ocp_apim_subscription_key.value
  }

  yaml_onboarding_func_slot_app_settings = {
    CONTRACTS_TOPIC_CONSUMER_GROUP        = "$Default"
    CONTRACTS_TOPIC_NAME                  = "sc-contracts"
    ENDPOINT_GET_INSTITUTION_FROM_TAXCODE = "https://api.selfcare.pagopa.it/external/v2/institutions/?taxCode="
    CONTRACTS_CONSUMER_CONNECTION_STRING  = data.azurerm_key_vault_secret.sc_contracts_conn_string.value
    SLACK_WEBHOOK_LOG                     = data.azurerm_key_vault_secret.slack_webhook_log.value
    SLACK_WEBHOOK_ONBOARDING_IO           = data.azurerm_key_vault_secret.slack_webhook_onboarding_io.value
    SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM   = data.azurerm_key_vault_secret.slack_webhook_onboarding_io_premium.value
    SLACK_WEBHOOK_ONBOARDING_PN           = data.azurerm_key_vault_secret.slack_webhook_onboarding_pn.value
    SLACK_WEBHOOK_ONBOARDING_INTEROP      = data.azurerm_key_vault_secret.slack_webhook_onboarding_interop.value
    SLACK_WEBHOOK_ONBOARDING_PAGOPA       = data.azurerm_key_vault_secret.slack_webhook_onboarding_pagopa.value
    OCP_APIM_SUBSCRIPTION_KEY             = data.azurerm_key_vault_secret.ocp_apim_subscription_key.value
    APPINSIGHTS_INSTRUMENTATIONKEY        = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY     = data.azurerm_key_vault_secret.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY.value
  }

  # ────────────────────────────────────────────────────────────
  # askmebot
  # ────────────────────────────────────────────────────────────

  yaml_askmebot_func_app_settings = {
    SERVICENAME                       = "Ask Me Bot"
    SLACK_API_URL                     = "https://slack.com/api"
    INSTITUTION_URL                   = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_URL                         = "https://api.selfcare.pagopa.it/external/internal/v1/institutions"
    CONTRACT_URL                      = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    SMTP_HOST                         = "smtp.gmail.com"
    SMTP_PORT                         = "587"
    SMTP_SECURE                       = "false"
    SMTP_USERNAME                     = "noreply@pagopa.it"
    FROM_EMAIL                        = "noreply@pagopa.it"
    CCN_EMAIL                         = "Bot_Selfcare@pagopa.it"
    MAX_DATA_LENGTH                   = "10"
    APPINSIGHTS_SAMPLING_PERCENTAGE   = "5"
    SLACK_BOT_TOKEN                   = data.azurerm_key_vault_secret.askmebot_slack_bot_token.value
    SLACK_SIGNING_SECRET              = data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value
    ENABLED_EMAILS_SECRET             = data.azurerm_key_vault_secret.askmebot_enabled_emails_secret.value
    LEGAL_ENABLED_EMAILS_SECRET       = data.azurerm_key_vault_secret.askmebot_legal_enabled_emails_secret.value
    USERS_APIM_SUBSCRIPTION_KEY       = data.azurerm_key_vault_secret.askmebot_users_apim_subscription_key.value
    CONTRACT_APIM_SUBSCRIPTION_KEY    = data.azurerm_key_vault_secret.askmebot_contract_apim_subscription_key.value
    SMTP_PASSWORD                     = data.azurerm_key_vault_secret.askmebot_smtp_password.value
    APPINSIGHTS_CONNECTION_STRING     = data.azurerm_key_vault_secret.appinsights_connection_string.value
    APPINSIGHTS_INSTRUMENTATIONKEY    = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value
    NODE_ENV                          = "production"
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY = data.azurerm_key_vault_secret.askmebot_FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY.value
  }

  yaml_askmebot_func_slot_app_settings = {
    SERVICENAME                       = "Ask Me Bot"
    SLACK_API_URL                     = "https://slack.com/api"
    INSTITUTION_URL                   = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_URL                         = "https://api.selfcare.pagopa.it/external/internal/v1/institutions"
    CONTRACT_URL                      = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    SMTP_HOST                         = "smtp.gmail.com"
    SMTP_PORT                         = "587"
    SMTP_SECURE                       = "false"
    SMTP_USERNAME                     = "noreply@pagopa.it"
    FROM_EMAIL                        = "noreply@pagopa.it"
    CCN_EMAIL                         = "Bot_Selfcare@pagopa.it"
    MAX_DATA_LENGTH                   = "10"
    APPINSIGHTS_SAMPLING_PERCENTAGE   = "5"
    SLACK_BOT_TOKEN                   = data.azurerm_key_vault_secret.askmebot_slack_bot_token.value
    SLACK_SIGNING_SECRET              = data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value
    ENABLED_EMAILS_SECRET             = data.azurerm_key_vault_secret.askmebot_enabled_emails_secret.value
    LEGAL_ENABLED_EMAILS_SECRET       = data.azurerm_key_vault_secret.askmebot_legal_enabled_emails_secret.value
    USERS_APIM_SUBSCRIPTION_KEY       = data.azurerm_key_vault_secret.askmebot_users_apim_subscription_key.value
    CONTRACT_APIM_SUBSCRIPTION_KEY    = data.azurerm_key_vault_secret.askmebot_contract_apim_subscription_key.value
    SMTP_PASSWORD                     = data.azurerm_key_vault_secret.askmebot_smtp_password.value
    APPINSIGHTS_CONNECTION_STRING     = data.azurerm_key_vault_secret.appinsights_connection_string.value
    APPINSIGHTS_INSTRUMENTATIONKEY    = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value
    NODE_ENV                          = "production"
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY = data.azurerm_key_vault_secret.askmebot_ocp_apim_subscription_key.value
  }

  # ────────────────────────────────────────────────────────────
  # auth_func
  # ────────────────────────────────────────────────────────────

  yaml_auth_func_app_settings = {
    NODE_ENV                 = "production"
    WEBSITE_RUN_FROM_PACKAGE = "1"
    MSAL_CLIENT_ID           = data.azurerm_key_vault_secret.auth_msal_client_id.value
    MSAL_TENANT_ID           = data.azurerm_key_vault_secret.auth_msal_tenant_id.value
    JWT_SECRET               = data.azurerm_key_vault_secret.auth_jwt_secret.value
    JWT_EXPIRY_SECONDS       = "3600"
    JWT_ISSUER               = "plsm-auth-service"
    JWT_AUDIENCE             = "plsm-fe-smcr"
  }

  yaml_auth_func_slot_app_settings = local.yaml_auth_func_app_settings

  # ────────────────────────────────────────────────────────────
  # portale_fatturazione
  # ────────────────────────────────────────────────────────────

  yaml_pf_func_app_settings = {
    API_KEY_SECRET       = data.azurerm_key_vault_secret.apikey_endpoint_pf.value
    STORAGE_ACCOUNT_NAME = data.azurerm_key_vault_secret.storage_pf_name.value
    CONTAINER_NAME       = data.azurerm_key_vault_secret.container_pf_name.value
  }

  yaml_pf_func_slot_app_settings = local.yaml_pf_func_app_settings

  # ────────────────────────────────────────────────────────────
  # backend_smcr
  # ────────────────────────────────────────────────────────────

  yaml_backend_app_settings = {}

  yaml_backend_slot_app_settings = local.yaml_backend_app_settings

  # ────────────────────────────────────────────────────────────
  # fe_smcr
  # ────────────────────────────────────────────────────────────

  yaml_fe_smcr_app_settings = {
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
    WEBHOOK_MANUAL_STORAGE                                = data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value
    STORAGE_TOKEN                                         = data.azurerm_key_vault_secret.fe_smcr_storage_token.value
    DB_HOST                                               = data.azurerm_key_vault_secret.db_host.value
    DB_USER                                               = data.azurerm_key_vault_secret.db_user.value
    DB_PASSWORD_B64                                       = data.azurerm_key_vault_secret.db_password_b64.value
    SLACK_CALL_MANAGEMENT_HOOK_TEST                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value
    SLACK_CALL_MANAGEMENT_HOOK_PROD                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value
    ONBOARDING_BASE_PATH_UAT                              = data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value
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
    NEXT_PUBLIC_APP_URL                                   = "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net"
    NEXT_PUBLIC_POST_LOGIN_REDIRECT                       = "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net"
    AUTH_FUNCTION_BASE_URL                                = "https://plsm-p-itn-auth-func-01.azurewebsites.net"
  }

  yaml_fe_smcr_slot_app_settings = {
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
    WEBHOOK_MANUAL_STORAGE                                = data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value
    STORAGE_TOKEN                                         = data.azurerm_key_vault_secret.fe_smcr_storage_token.value
    DB_HOST                                               = data.azurerm_key_vault_secret.db_host.value
    DB_USER                                               = data.azurerm_key_vault_secret.db_user.value
    DB_PASSWORD_B64                                       = data.azurerm_key_vault_secret.db_password_b64.value
    SLACK_CALL_MANAGEMENT_HOOK_TEST                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value
    SLACK_CALL_MANAGEMENT_HOOK_PROD                       = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value
    ONBOARDING_BASE_PATH_UAT                              = data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value
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
    NEXT_PUBLIC_APP_URL                                   = "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net"
    NEXT_PUBLIC_POST_LOGIN_REDIRECT                       = "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net"
    AUTH_FUNCTION_BASE_URL                                = "https://plsm-p-itn-auth-func-01-staging.azurewebsites.net"
  }

  # ────────────────────────────────────────────────────────────
  # crm_function
  # ────────────────────────────────────────────────────────────

  yaml_crm_func_app_settings = {
    DYNAMICS_BASE_URL        = data.azurerm_key_vault_secret.dynamics_base_url.value
    DYNAMICS_URL_CONTACTS    = data.azurerm_key_vault_secret.dynamics_url_contacts.value
    NODE_ENV                 = "production"
    WEBSITE_RUN_FROM_PACKAGE = "1"
    DEBUG                    = "true"
  }

  yaml_crm_func_slot_app_settings = local.yaml_crm_func_app_settings

  # ────────────────────────────────────────────────────────────────
  # Metadati ambiente
  # ────────────────────────────────────────────────────────────────

  yaml_environment = {
    prefix          = "plsm"
    env_short       = "p"
    location        = "italynorth"
    instance_number = "01"
  }

  yaml_tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }
}
