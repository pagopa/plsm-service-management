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

  # Function Certificates - Common
  common_certificates_func_app_settings = {
    DB_HOST     = "${data.azurerm_key_vault_secret.db_host.value}"
    DB_NAME     = "certificates"
    DB_TABLE    = "certificates"
    DB_USER     = "${data.azurerm_key_vault_secret.db_user.value}"
    DB_PASSWORD = "${data.azurerm_key_vault_secret.db_password.value}"
    DB_PORT     = 5432
    DB_SSL      = true
  }

  # Function Onboarding - Common
  common_onboarding_func_app_settings = {
    APPINSIGHTS_INSTRUMENTATIONKEY        = "${data.azurerm_key_vault_secret.appinsights-instrumentationkey.value}"
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

  common_askmebot_func_app_settings = {
    SERVICENAME                    = "Ask Me Bot"
    SLACK_BOT_TOKEN                = "${data.azurerm_key_vault_secret.askmebot_slack_bot_token.value}"
    SLACK_SIGNING_SECRET           = "${data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value}"
    ENABLED_EMAILS_SECRET          = "${data.azurerm_key_vault_secret.askmebot_enabled_emails_secret.value}"
    LEGAL_ENABLED_EMAILS_SECRET    = "${data.azurerm_key_vault_secret.askmebot_legal_enabled_emails_secret.value}"
    OCP_APIM_SUBSCRIPTION_KEY      = "${data.azurerm_key_vault_secret.askmebot_ocp_apim_subscription_key.value}"
    SLACK_API_URL                  = "https://slack.com/api"
    INSTITUTION_URL                = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_URL                      = "https://api.selfcare.pagopa.it/external/internal/v1/institutions"
    CONTRACT_URL                   = "https://api.selfcare.pagopa.it/external/support/v1/institutions"
    USERS_APIM_SUBSCRIPTION_KEY    = "${data.azurerm_key_vault_secret.askmebot_users_apim_subscription_key.value}"
    CONTRACT_APIM_SUBSCRIPTION_KEY = "${data.azurerm_key_vault_secret.askmebot_contract_apim_subscription_key.value}"
    SMTP_HOST                      = "smtp.gmail.com"
    SMTP_PORT                      = "587"
    SMTP_SECURE                    = false
    SMTP_USERNAME                  = "noreply@pagopa.it"
    SMTP_PASSWORD                  = "${data.azurerm_key_vault_secret.askmebot_smtp_password.value}"
    FROM_EMAIL                     = "noreply@pagopa.it"
    CCN_EMAIL                      = "Bot_Selfcare@pagopa.it"
    MAX_DATA_LENGTH                = "10"
    APPINSIGHTS_CONNECTION_STRING  = "${data.azurerm_key_vault_secret.appinsights_connection_string.value}"
  }

  # App Service
  common_app_settings = {

    DiagnosticServices_EXTENSION_VERSION            = "~3"
    InstrumentationEngine_EXTENSION_VERSION         = "disabled"
    SnapshotDebugger_EXTENSION_VERSION              = "disabled"
    XDT_MicrosoftApplicationInsights_BaseExtensions = "disabled"
    XDT_MicrosoftApplicationInsights_Mode           = "recommended"
    XDT_MicrosoftApplicationInsights_PreemptSdk     = "disabled"
    TIMEOUT_DELAY                                   = 300

    # Impostazioni App
    # WEBSITE_DNS_SERVER   = "168.63.129.16"
    # WEBSITE_STARTUP_FILE = "npm start"
    # WEBSITES_PORT        = 3000

    # # Secrets da Key Vault
    # SLACK_REPORT_HOOK            = data.azurerm_key_vault_secret.slack_report_hook.value
    # USER_APIM_SUBSCRIPTION_KEY   = data.azurerm_key_vault_secret.user_apim_subscription_key.value
    # USERS_API_KEY                = data.azurerm_key_vault_secret.users_api_key.value
    # OCP_APIM_SUBSCRIPTION_KEY    = data.azurerm_key_vault_secret.ocp_apim_subscription_key.value
    # SUBSCRIPTION_KEY_SELFCARE    = data.azurerm_key_vault_secret.subscription_key_selfcare.value
    # API_KEY_INSTITUTION          = data.azurerm_key_vault_secret.api_key_institution.value
    # API_KEY_PROD_GET_INFOCAMERE  = data.azurerm_key_vault_secret.api_key_prod_get_infocamere.value
    # API_KEY_PROD_GET_INSTITUTION = data.azurerm_key_vault_secret.api_key_prod_get_institution.value
    # API_KEY_PROD_GET_IPA         = data.azurerm_key_vault_secret.api_key_prod_get_ipa.value
    # API_KEY_PROD_GET_USERS       = data.azurerm_key_vault_secret.api_key_prod_get_users.value
    # DB_HOST                      = data.azurerm_key_vault_secret.db_host.value
    # DB_NAME                      = data.azurerm_key_vault_secret.db_name.value
    # DB_USER                      = data.azurerm_key_vault_secret.db_user.value
    # DB_PASSWORD_B64              = data.azurerm_key_vault_secret.db_password_b64.value
    # DB_PORT                      = 5432
    # DB_SSL                       = true
    # NEXT_PUBLIC_MSAL_CLIENT_ID   = data.azurerm_key_vault_secret.next_public_msal_client_id.value
    # NEXT_PUBLIC_MSAL_TENANT_ID   = data.azurerm_key_vault_secret.next_public_msal_tenant_id.value

    # # Variabili e URL
    # GET_INFOCAMERE                  = "external/internal/v1/infocamere-pdnd/institution/"
    # GET_INSTITUTION                 = "external/support/v1/institutions"
    # GET_IPA                         = "external/internal/v1/institutions/"
    # GET_IPA_AOO                     = "external/internal/v1/aoo/"
    # GET_IPA_UO                      = "external/internal/v1/uo/"
    # GET_STATUS                      = "external/support/v1/onboarding/institutionOnboardings"
    # GET_USERS_PATH                  = "external/v2/users"
    # NEXT_PUBLIC_APP_URL             = "https://sm-d-itn-pg-smcr-app-01.azurewebsites.net"
    # NEXT_PUBLIC_MSAL_REDIRECT_URI   = "https://sm-d-itn-pg-smcr-app-01.azurewebsites.net/api/auth/callback/microsoft"
    # NEXT_PUBLIC_POST_LOGIN_REDIRECT = "https://sm-d-itn-pg-smcr-app-01.azurewebsites.net"
    # ONBOARDING_BASE_PATH            = "https://api.selfcare.pagopa.it/"
    # SELFCARE                        = "external/support/v1/institutions"
    # UPLOAD                          = "external/internal/v1/onboarding/"
    # UPLOAD_UAT                      = "https://webhook.site/212ad2c5-4937-4548-92ba-9e56afcdb04e"
  }


}
