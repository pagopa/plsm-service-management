locals {
  environment = {
    prefix          = "sm" # Prefisso per team service management
    env_short       = "p"  # 'd' per dev, 'u' per uat, 'p' per prod
    location        = "italynorth"
    instance_number = "001" # Numero di istanza (utile se ne hai più di una)
    domain          = "plsm"
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

  # App Service
  common_app_settings = {
    # Monitoring
    #APPINSIGHTS_CONNECTION_STRING                   = module.app_insights.appinsights_connection_string
    #APPINSIGHTS_PROFILERFEATURE_VERSION             = "1.0.0"
    #APPINSIGHTS_SNAPSHOTFEATURE_VERSION             = "1.0.0"
    #APPLICATIONINSIGHTS_CONFIGURATION_CONTENT       = ""
    #ApplicationInsightsAgent_EXTENSION_VERSION      = "~3"
    DiagnosticServices_EXTENSION_VERSION            = "~3"
    InstrumentationEngine_EXTENSION_VERSION         = "disabled"
    SnapshotDebugger_EXTENSION_VERSION              = "disabled"
    XDT_MicrosoftApplicationInsights_BaseExtensions = "disabled"
    XDT_MicrosoftApplicationInsights_Mode           = "recommended"
    XDT_MicrosoftApplicationInsights_PreemptSdk     = "disabled"
    TIMEOUT_DELAY                                   = 300

    # Impostazioni App
    WEBSITE_DNS_SERVER   = "168.63.129.16"
    WEBSITE_STARTUP_FILE = "npm start"
    WEBSITES_PORT        = 3000

    # Secrets da Key Vault
    SLACK_REPORT_HOOK            = data.azurerm_key_vault_secret.slack_report_hook.value
    USER_APIM_SUBSCRIPTION_KEY   = data.azurerm_key_vault_secret.user_apim_subscription_key.value
    USERS_API_KEY                = data.azurerm_key_vault_secret.users_api_key.value
    OCP_APIM_SUBSCRIPTION_KEY    = data.azurerm_key_vault_secret.ocp_apim_subscription_key.value
    SUBSCRIPTION_KEY_SELFCARE    = data.azurerm_key_vault_secret.subscription_key_selfcare.value
    API_KEY_INSTITUTION          = data.azurerm_key_vault_secret.api_key_institution.value
    API_KEY_PROD_GET_INFOCAMERE  = data.azurerm_key_vault_secret.api_key_prod_get_infocamere.value
    API_KEY_PROD_GET_INSTITUTION = data.azurerm_key_vault_secret.api_key_prod_get_institution.value
    API_KEY_PROD_GET_IPA         = data.azurerm_key_vault_secret.api_key_prod_get_ipa.value
    API_KEY_PROD_GET_USERS       = data.azurerm_key_vault_secret.api_key_prod_get_users.value
    DB_HOST                      = data.azurerm_key_vault_secret.db_host.value
    DB_NAME                      = data.azurerm_key_vault_secret.db_name.value
    DB_USER                      = data.azurerm_key_vault_secret.db_user.value
    DB_PASSWORD_B64              = data.azurerm_key_vault_secret.db_password_b64.value
    DB_PORT                      = 5432
    DB_SSL                       = true
    NEXT_PUBLIC_MSAL_CLIENT_ID   = data.azurerm_key_vault_secret.next_public_msal_client_id.value
    NEXT_PUBLIC_MSAL_TENANT_ID   = data.azurerm_key_vault_secret.next_public_msal_tenant_id.value

    # Variabili e URL
    GET_INFOCAMERE                  = "external/internal/v1/infocamere-pdnd/institution/"
    GET_INSTITUTION                 = "external/support/v1/institutions"
    GET_IPA                         = "external/internal/v1/institutions/"
    GET_IPA_AOO                     = "external/internal/v1/aoo/"
    GET_IPA_UO                      = "external/internal/v1/uo/"
    GET_STATUS                      = "external/support/v1/onboarding/institutionOnboardings"
    GET_USERS_PATH                  = "external/v2/users"
    NEXT_PUBLIC_APP_URL             = "https://sm-d-itn-pg-smcr-app-01.azurewebsites.net"
    NEXT_PUBLIC_MSAL_REDIRECT_URI   = "https://sm-d-itn-pg-smcr-app-01.azurewebsites.net/api/auth/callback/microsoft"
    NEXT_PUBLIC_POST_LOGIN_REDIRECT = "https://sm-d-itn-pg-smcr-app-01.azurewebsites.net"
    ONBOARDING_BASE_PATH            = "https://api.selfcare.pagopa.it/"
    SELFCARE                        = "external/support/v1/institutions"
    UPLOAD                          = "external/internal/v1/onboarding/"
    UPLOAD_UAT                      = "https://webhook.site/212ad2c5-4937-4548-92ba-9e56afcdb04e"
  }


}
