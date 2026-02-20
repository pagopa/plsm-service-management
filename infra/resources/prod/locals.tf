locals {
  environment = {
    prefix          = "plsm" # Prefisso per team service management
    env_short       = "p"    # 'd' per dev, 'u' per uat, 'p' per prod
    location        = "italynorth"
    instance_number = "01" # Numero di istanza (utile se ne hai più di una)
    # domain          = "sm"
  }

  instance_number = "01"

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }

  dns_default_ttl_sec       = 3600
  enable_smcr_custom_domain = true

  common_app_settings = {
    DiagnosticServices_EXTENSION_VERSION            = "~3"
    InstrumentationEngine_EXTENSION_VERSION         = "disabled"
    SnapshotDebugger_EXTENSION_VERSION              = "disabled"
    XDT_MicrosoftApplicationInsights_BaseExtensions = "disabled"
    XDT_MicrosoftApplicationInsights_Mode           = "recommended"
    XDT_MicrosoftApplicationInsights_PreemptSdk     = "disabled"
    TIMEOUT_DELAY                                   = 300
  }


  # Function Portale Fatturazione
  pf_app_settings = {
    API_KEY_SECRET       = "${data.azurerm_key_vault_secret.apikey_endpoint_pf.value}"
    STORAGE_ACCOUNT_NAME = "${data.azurerm_key_vault_secret.storage_pf_name.value}"
    CONTAINER_NAME       = "${data.azurerm_key_vault_secret.container_pf_name.value}"
  }

  pf_slot_app_settings = {
    API_KEY_SECRET       = "${data.azurerm_key_vault_secret.apikey_endpoint_pf.value}"
    STORAGE_ACCOUNT_NAME = "${data.azurerm_key_vault_secret.storage_pf_name.value}"
    CONTAINER_NAME       = "${data.azurerm_key_vault_secret.container_pf_name.value}"
  }

  # Function Certificates - Common
  certificates_func_app_settings = {
    DB_HOST     = "${data.azurerm_key_vault_secret.db_host.value}"
    DB_NAME     = "certificates"
    DB_TABLE    = "certificates"
    DB_USER     = "${data.azurerm_key_vault_secret.db_user.value}"
    DB_PASSWORD = "${data.azurerm_key_vault_secret.db_password.value}"
    DB_PORT     = 5432
    DB_SSL      = true
  }

  certificates_slot_func_app_settings = {
    DB_HOST     = "${data.azurerm_key_vault_secret.db_host.value}"
    DB_NAME     = "certificates"
    DB_TABLE    = "certificates"
    DB_USER     = "${data.azurerm_key_vault_secret.db_user.value}"
    DB_PASSWORD = "${data.azurerm_key_vault_secret.db_password.value}"
    DB_PORT     = 5432
    DB_SSL      = true
  }

  # Function Onboarding - Common

  onboarding_func_app_settings = {

    CONTRACTS_TOPIC_CONSUMER_GROUP        = "$Default"
    CONTRACTS_CONSUMER_CONNECTION_STRING  = "${data.azurerm_key_vault_secret.sc_contracts_conn_string.value}"
    CONTRACTS_TOPIC_NAME                  = "sc-contracts"
    SLACK_WEBHOOK_LOG                     = "${data.azurerm_key_vault_secret.slack_webhook_log.value}"
    SLACK_WEBHOOK_ONBOARDING_IO           = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_io.value}"
    SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM   = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_io_premium.value}"
    SLACK_WEBHOOK_ONBOARDING_PN           = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_pn.value}"
    SLACK_WEBHOOK_ONBOARDING_INTEROP      = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_interop.value}"
    SLACK_WEBHOOK_ONBOARDING_PAGOPA       = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_pagopa.value}"
    OCP_APIM_SUBSCRIPTION_KEY             = "${data.azurerm_key_vault_secret.ocp_apim_subscription_key.value}"
    ENDPOINT_GET_INSTITUTION_FROM_TAXCODE = "https://api.selfcare.pagopa.it/external/v2/institutions/?taxCode="
  }

  onboarding_slot_func_app_settings = {
    APPINSIGHTS_INSTRUMENTATIONKEY        = "${data.azurerm_key_vault_secret.appinsights_instrumentationkey.value}"
    CONTRACTS_TOPIC_CONSUMER_GROUP        = "$Default"
    CONTRACTS_CONSUMER_CONNECTION_STRING  = "${data.azurerm_key_vault_secret.sc_contracts_conn_string.value}"
    CONTRACTS_TOPIC_NAME                  = "sc-contracts"
    SLACK_WEBHOOK_LOG                     = "${data.azurerm_key_vault_secret.slack_webhook_log.value}"
    SLACK_WEBHOOK_ONBOARDING_IO           = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_io.value}"
    SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM   = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_io_premium.value}"
    SLACK_WEBHOOK_ONBOARDING_PN           = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_pn.value}"
    SLACK_WEBHOOK_ONBOARDING_INTEROP      = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_interop.value}"
    SLACK_WEBHOOK_ONBOARDING_PAGOPA       = "${data.azurerm_key_vault_secret.slack_webhook_onboarding_pagopa.value}"
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY     = "${data.azurerm_key_vault_secret.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY.value}"
    ENDPOINT_GET_INSTITUTION_FROM_TAXCODE = "https://api.selfcare.pagopa.it/external/v2/institutions/?taxCode="

  }

  # Funzione ASK ME BOT

  askmebot_func_app_settings = {
    SERVICENAME                       = "Ask Me Bot"
    SLACK_BOT_TOKEN                   = "${data.azurerm_key_vault_secret.askmebot_slack_bot_token.value}"
    SLACK_SIGNING_SECRET              = "${data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value}"
    ENABLED_EMAILS_SECRET             = "${data.azurerm_key_vault_secret.askmebot_enabled_emails_secret.value}"
    LEGAL_ENABLED_EMAILS_SECRET       = "${data.azurerm_key_vault_secret.askmebot_legal_enabled_emails_secret.value}"
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY = "${data.azurerm_key_vault_secret.askmebot_FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY.value}"
    SLACK_API_URL                     = "https://slack.com/api"
    INSTITUTION_URL                   = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_URL                         = "https://api.selfcare.pagopa.it/external/internal/v1/institutions"
    CONTRACT_URL                      = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_APIM_SUBSCRIPTION_KEY       = "${data.azurerm_key_vault_secret.askmebot_users_apim_subscription_key.value}"
    CONTRACT_APIM_SUBSCRIPTION_KEY    = "${data.azurerm_key_vault_secret.askmebot_contract_apim_subscription_key.value}"
    SMTP_HOST                         = "smtp.gmail.com"
    SMTP_PORT                         = "587"
    SMTP_SECURE                       = false
    SMTP_USERNAME                     = "noreply@pagopa.it"
    SMTP_PASSWORD                     = "${data.azurerm_key_vault_secret.askmebot_smtp_password.value}"
    FROM_EMAIL                        = "noreply@pagopa.it"
    CCN_EMAIL                         = "Bot_Selfcare@pagopa.it"
    MAX_DATA_LENGTH                   = "10"
    APPINSIGHTS_CONNECTION_STRING     = "${data.azurerm_key_vault_secret.appinsights_connection_string.value}"
    APPINSIGHTS_INSTRUMENTATIONKEY    = "${data.azurerm_key_vault_secret.appinsights_instrumentationkey.value}"
    APPINSIGHTS_SAMPLING_PERCENTAGE   = 5
    NODE_ENV                          = "production"
  }

  askmebot_func_slot_app_settings = {
    SERVICENAME                       = "Ask Me Bot"
    SLACK_BOT_TOKEN                   = "${data.azurerm_key_vault_secret.askmebot_slack_bot_token.value}"
    SLACK_SIGNING_SECRET              = "${data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value}"
    ENABLED_EMAILS_SECRET             = "${data.azurerm_key_vault_secret.askmebot_enabled_emails_secret.value}"
    LEGAL_ENABLED_EMAILS_SECRET       = "${data.azurerm_key_vault_secret.askmebot_legal_enabled_emails_secret.value}"
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY = "${data.azurerm_key_vault_secret.askmebot_ocp_apim_subscription_key.value}"
    SLACK_API_URL                     = "https://slack.com/api"
    INSTITUTION_URL                   = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_URL                         = "https://api.selfcare.pagopa.it/external/internal/v1/institutions"
    CONTRACT_URL                      = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_APIM_SUBSCRIPTION_KEY       = "${data.azurerm_key_vault_secret.askmebot_users_apim_subscription_key.value}"
    CONTRACT_APIM_SUBSCRIPTION_KEY    = "${data.azurerm_key_vault_secret.askmebot_contract_apim_subscription_key.value}"
    SMTP_HOST                         = "smtp.gmail.com"
    SMTP_PORT                         = "587"
    SMTP_SECURE                       = false
    SMTP_USERNAME                     = "noreply@pagopa.it"
    SMTP_PASSWORD                     = "${data.azurerm_key_vault_secret.askmebot_smtp_password.value}"
    FROM_EMAIL                        = "noreply@pagopa.it"
    CCN_EMAIL                         = "Bot_Selfcare@pagopa.it"
    MAX_DATA_LENGTH                   = "10"
    APPINSIGHTS_CONNECTION_STRING     = "${data.azurerm_key_vault_secret.appinsights_connection_string.value}"
    APPINSIGHTS_INSTRUMENTATIONKEY    = "${data.azurerm_key_vault_secret.appinsights_instrumentationkey.value}"
    APPINSIGHTS_SAMPLING_PERCENTAGE   = 5
    NODE_ENV                          = "production"
  }

  # BACKEND App Service
  backend_app_settings = {
  }
  backend_slot_app_settings = {
  }

  # FRONTEND FE-SMCR
  fe_smcr_app_settings = {
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT       = "${data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key_uat.value}"
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST = "${data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_test.value}"
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD = "${data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_prod.value}"
    FE_SMCR_USERS_API_KEY                       = "${data.azurerm_key_vault_secret.fe_smcr_users_api_key.value}"
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY           = "${data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key.value}"
    FE_SMCR_API_KEY_INSTITUTION                 = "${data.azurerm_key_vault_secret.fe_smcr_api_key_institution.value}"
    FE_SMCR_API_KEY_PROD_GET_USERS              = "${data.azurerm_key_vault_secret.fe_smcr_api_key_prod_get_users.value}"
    FE_SMCR_API_KEY_SERVICES                    = "${data.azurerm_key_vault_secret.fe_smcr_api_key_services.value}"
    FE_SMCR_API_KEY_PNPG                        = "${data.azurerm_key_vault_secret.fe_smcr_api_key_pnpg.value}"
    FE_SMCR_API_KEY_FIRMA_CON_IO                = "${data.azurerm_key_vault_secret.fe_smcr_api_key_firma_con_io.value}"
    FE_SMCR_SLACK_REPORT_HOOK                   = "${data.azurerm_key_vault_secret.fe_smcr_slack_report_hook.value}"
    FE_SMCR_SLACK_CALL_MANAGEMENT_HOOK          = "${data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook.value}"
    WEBHOOK_MANUAL_STORAGE                      = "${data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value}"
    STORAGE_TOKEN                               = "${data.azurerm_key_vault_secret.fe_smcr_storage_token.value}"

    DB_HOST         = "${data.azurerm_key_vault_secret.db_host.value}"
    DB_USER         = "${data.azurerm_key_vault_secret.db_user.value}"
    DB_NAME         = "dbsmcr"
    DB_TABLE        = "dbsmcr"
    DB_PASSWORD_B64 = "${data.azurerm_key_vault_secret.db_password_b64.value}"


    SLACK_CALL_MANAGEMENT_HOOK_TEST = "${data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value}"
    SLACK_CALL_MANAGEMENT_HOOK_PROD = "${data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value}"

    GET_INFOCAMERE                  = "external/internal/v1/infocamere-pdnd/institution/"
    GET_INSTITUTION                 = "external/support/v1/institutions"
    GET_IPA                         = "external/internal/v1/institutions/"
    GET_IPA_UO                      = "external/internal/v1/uo/"
    GET_IPA_AOO                     = "external/internal/v1/aoo/"
    GET_STATUS                      = "external/support/v1/onboarding/institutionOnboardings"
    ONBOARDING_BASE_PATH            = "https://api.selfcare.pagopa.it/"
    ONBOARDING_BASE_PATH_UAT        = "${data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value}"
    UPLOAD                          = "external/internal/v1/onboarding/"
    NEXT_PUBLIC_APP_URL             = "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net"
    NEXT_PUBLIC_MSAL_REDIRECT_URI   = "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/api/auth/callback/microsoft"
    NEXT_PUBLIC_POST_LOGIN_REDIRECT = "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net"
    NEXT_PUBLIC_MSAL_CLIENT_ID      = "${data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_client_id.value}"
    NEXT_PUBLIC_MSAL_TENANT_ID      = "${data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_tenant_id.value}"

    DB_PORT = 5432
    DB_SSL  = true
  }

  fe_smcr_slot_app_settings = {
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT       = "${data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key_uat.value}"
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST = "${data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_test.value}"
    FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD = "${data.azurerm_key_vault_secret.fe_smcr_api_slack_call_management_hook_prod.value}"
    FE_SMCR_USERS_API_KEY                       = "${data.azurerm_key_vault_secret.fe_smcr_users_api_key.value}"
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY           = "${data.azurerm_key_vault_secret.fe_smcr_ocp_apim_subscription_key.value}"
    FE_SMCR_API_KEY_INSTITUTION                 = "${data.azurerm_key_vault_secret.fe_smcr_api_key_institution.value}"
    FE_SMCR_API_KEY_PROD_GET_USERS              = "${data.azurerm_key_vault_secret.fe_smcr_api_key_prod_get_users.value}"
    FE_SMCR_API_KEY_SERVICES                    = "${data.azurerm_key_vault_secret.fe_smcr_api_key_services.value}"
    FE_SMCR_API_KEY_PNPG                        = "${data.azurerm_key_vault_secret.fe_smcr_api_key_pnpg.value}"
    FE_SMCR_API_KEY_FIRMA_CON_IO                = "${data.azurerm_key_vault_secret.fe_smcr_api_key_firma_con_io.value}"
    FE_SMCR_SLACK_REPORT_HOOK                   = "${data.azurerm_key_vault_secret.fe_smcr_slack_report_hook.value}"
    FE_SMCR_SLACK_CALL_MANAGEMENT_HOOK          = "${data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook.value}"
    WEBHOOK_MANUAL_STORAGE                      = "${data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value}"
    STORAGE_TOKEN                               = "${data.azurerm_key_vault_secret.fe_smcr_storage_token.value}"

    DB_HOST         = "${data.azurerm_key_vault_secret.db_host.value}"
    DB_USER         = "${data.azurerm_key_vault_secret.db_user.value}"
    DB_NAME         = "dbsmcr"
    DB_TABLE        = "dbsmcr"
    DB_PASSWORD_B64 = "${data.azurerm_key_vault_secret.db_password_b64.value}"

    SLACK_CALL_MANAGEMENT_HOOK_TEST = "${data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value}"
    SLACK_CALL_MANAGEMENT_HOOK_PROD = "${data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value}"

    GET_INFOCAMERE                  = "external/internal/v1/infocamere-pdnd/institution/"
    GET_INSTITUTION                 = "external/support/v1/institutions"
    GET_IPA                         = "external/internal/v1/institutions/"
    GET_IPA_UO                      = "external/internal/v1/uo/"
    GET_IPA_AOO                     = "external/internal/v1/aoo/"
    GET_STATUS                      = "external/support/v1/onboarding/institutionOnboardings"
    ONBOARDING_BASE_PATH            = "https://api.selfcare.pagopa.it/"
    ONBOARDING_BASE_PATH_UAT        = "${data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value}"
    UPLOAD                          = "external/internal/v1/onboarding/"
    NEXT_PUBLIC_APP_URL             = "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net"
    NEXT_PUBLIC_MSAL_REDIRECT_URI   = "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net/api/auth/callback/microsoft"
    NEXT_PUBLIC_POST_LOGIN_REDIRECT = "https://plsm-p-itn-fe-smcr-app-01-staging.azurewebsites.net"
    NEXT_PUBLIC_MSAL_CLIENT_ID      = "${data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_client_id.value}"
    NEXT_PUBLIC_MSAL_TENANT_ID      = "${data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_tenant_id.value}"

    DB_PORT = 5432
    DB_SSL  = true
  }

  # Function CRM (Dynamics)
  crm_func_app_settings = {
    DYNAMICS_BASE_URL        = "${data.azurerm_key_vault_secret.dynamics_base_url.value}"
    DYNAMICS_URL_CONTACTS    = "${data.azurerm_key_vault_secret.dynamics_url_contacts.value}"
    NODE_ENV                 = "production"
    WEBSITE_RUN_FROM_PACKAGE = 1
  }

  crm_func_slot_app_settings = {
    DYNAMICS_BASE_URL        = "${data.azurerm_key_vault_secret.dynamics_base_url.value}"
    DYNAMICS_URL_CONTACTS    = "${data.azurerm_key_vault_secret.dynamics_url_contacts.value}"
    NODE_ENV                 = "production"
    WEBSITE_RUN_FROM_PACKAGE = 1
  }


}
