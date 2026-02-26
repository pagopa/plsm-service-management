# =============================================================================
# YAML-Based Configuration Management
# =============================================================================
# This file implements YAML-based configuration for infrastructure resources.
# 
# Benefits:
# - Single source of truth for environment configurations
# - Easy to add new environments (just create new YAML file)
# - Reduced duplication between production/staging slots
# - Better separation between infrastructure code and configuration
# - Easier to review configuration changes in PRs
#
# Usage:
# 1. Define common settings in environments/common.yaml
# 2. Define environment-specific settings in environments/{env}.yaml
# 3. Terraform reads and merges these configurations at plan/apply time
#
# This configuration now covers all 6 applications:
# 1. Portale Fatturazione (pf)
# 2. Certificates
# 3. Onboarding
# 4. Ask Me Bot (askmebot)
# 5. Backend SMCR (backend-smcr)
# 6. Frontend FE-SMCR
# 7. CRM (Dynamics)
# =============================================================================

# Load YAML configuration files
locals {
  # Read common configuration (shared across all environments)
  common_config = yamldecode(file("${path.module}/../environments/common.yaml"))

  # Read environment-specific configuration (prod, uat, etc.)
  env_config = yamldecode(file("${path.module}/../environments/prod.yaml"))

  # Extract common app settings from YAML
  yaml_common_app_settings = {
    DiagnosticServices_EXTENSION_VERSION            = local.common_config.app_insights.diagnostic_services_extension_version
    InstrumentationEngine_EXTENSION_VERSION         = local.common_config.app_insights.instrumentation_engine_extension_version
    SnapshotDebugger_EXTENSION_VERSION              = local.common_config.app_insights.snapshot_debugger_extension_version
    XDT_MicrosoftApplicationInsights_BaseExtensions = local.common_config.app_insights.xdt_microsoft_application_insights_base_extensions
    XDT_MicrosoftApplicationInsights_Mode           = local.common_config.app_insights.xdt_microsoft_application_insights_mode
    XDT_MicrosoftApplicationInsights_PreemptSdk     = local.common_config.app_insights.xdt_microsoft_application_insights_preempt_sdk
    TIMEOUT_DELAY                                   = local.common_config.common.timeout_delay
  }

  # =============================================================================
  # 1. Portale Fatturazione (PF)
  # =============================================================================

  yaml_pf_app_settings = {
    API_KEY_SECRET       = data.azurerm_key_vault_secret.apikey_endpoint_pf.value
    STORAGE_ACCOUNT_NAME = data.azurerm_key_vault_secret.storage_pf_name.value
    CONTAINER_NAME       = data.azurerm_key_vault_secret.container_pf_name.value
  }

  yaml_pf_slot_app_settings = {
    API_KEY_SECRET       = data.azurerm_key_vault_secret.apikey_endpoint_pf.value
    STORAGE_ACCOUNT_NAME = data.azurerm_key_vault_secret.storage_pf_name.value
    CONTAINER_NAME       = data.azurerm_key_vault_secret.container_pf_name.value
  }

  # =============================================================================
  # 2. Certificates Function
  # =============================================================================

  yaml_certificates_func_app_settings = {
    DB_HOST     = data.azurerm_key_vault_secret.db_host.value
    DB_NAME     = local.common_config.certificates.db_name
    DB_TABLE    = local.common_config.certificates.db_table
    DB_USER     = data.azurerm_key_vault_secret.db_user.value
    DB_PASSWORD = data.azurerm_key_vault_secret.db_password.value
    DB_PORT     = local.common_config.database.port
    DB_SSL      = local.common_config.database.ssl
  }

  yaml_certificates_slot_func_app_settings = {
    DB_HOST     = data.azurerm_key_vault_secret.db_host.value
    DB_NAME     = local.common_config.certificates.db_name
    DB_TABLE    = local.common_config.certificates.db_table
    DB_USER     = data.azurerm_key_vault_secret.db_user.value
    DB_PASSWORD = data.azurerm_key_vault_secret.db_password.value
    DB_PORT     = local.common_config.database.port
    DB_SSL      = local.common_config.database.ssl
  }

  # =============================================================================
  # 3. Onboarding Function
  # =============================================================================

  yaml_onboarding_func_app_settings = {
    CONTRACTS_TOPIC_CONSUMER_GROUP        = local.common_config.onboarding.contracts_topic_consumer_group
    CONTRACTS_CONSUMER_CONNECTION_STRING  = data.azurerm_key_vault_secret.sc_contracts_conn_string.value
    CONTRACTS_TOPIC_NAME                  = local.common_config.onboarding.contracts_topic_name
    SLACK_WEBHOOK_LOG                     = data.azurerm_key_vault_secret.slack_webhook_log.value
    SLACK_WEBHOOK_ONBOARDING_IO           = data.azurerm_key_vault_secret.slack_webhook_onboarding_io.value
    SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM   = data.azurerm_key_vault_secret.slack_webhook_onboarding_io_premium.value
    SLACK_WEBHOOK_ONBOARDING_PN           = data.azurerm_key_vault_secret.slack_webhook_onboarding_pn.value
    SLACK_WEBHOOK_ONBOARDING_INTEROP      = data.azurerm_key_vault_secret.slack_webhook_onboarding_interop.value
    SLACK_WEBHOOK_ONBOARDING_PAGOPA       = data.azurerm_key_vault_secret.slack_webhook_onboarding_pagopa.value
    OCP_APIM_SUBSCRIPTION_KEY             = data.azurerm_key_vault_secret.ocp_apim_subscription_key.value
    ENDPOINT_GET_INSTITUTION_FROM_TAXCODE = local.common_config.onboarding.endpoint_get_institution_from_taxcode
  }

  yaml_onboarding_slot_func_app_settings = {
    APPINSIGHTS_INSTRUMENTATIONKEY        = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value
    CONTRACTS_TOPIC_CONSUMER_GROUP        = local.common_config.onboarding.contracts_topic_consumer_group
    CONTRACTS_CONSUMER_CONNECTION_STRING  = data.azurerm_key_vault_secret.sc_contracts_conn_string.value
    CONTRACTS_TOPIC_NAME                  = local.common_config.onboarding.contracts_topic_name
    SLACK_WEBHOOK_LOG                     = data.azurerm_key_vault_secret.slack_webhook_log.value
    SLACK_WEBHOOK_ONBOARDING_IO           = data.azurerm_key_vault_secret.slack_webhook_onboarding_io.value
    SLACK_WEBHOOK_ONBOARDING_IO_PREMIUM   = data.azurerm_key_vault_secret.slack_webhook_onboarding_io_premium.value
    SLACK_WEBHOOK_ONBOARDING_PN           = data.azurerm_key_vault_secret.slack_webhook_onboarding_pn.value
    SLACK_WEBHOOK_ONBOARDING_INTEROP      = data.azurerm_key_vault_secret.slack_webhook_onboarding_interop.value
    SLACK_WEBHOOK_ONBOARDING_PAGOPA       = data.azurerm_key_vault_secret.slack_webhook_onboarding_pagopa.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY     = data.azurerm_key_vault_secret.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY.value
    ENDPOINT_GET_INSTITUTION_FROM_TAXCODE = local.common_config.onboarding.endpoint_get_institution_from_taxcode
  }

  # =============================================================================
  # 4. Ask Me Bot Function (Exposed)
  # =============================================================================

  yaml_askmebot_func_app_settings = {
    SERVICENAME                       = local.common_config.askmebot.service_name
    SLACK_BOT_TOKEN                   = data.azurerm_key_vault_secret.askmebot_slack_bot_token.value
    SLACK_SIGNING_SECRET              = data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value
    ENABLED_EMAILS_SECRET             = data.azurerm_key_vault_secret.askmebot_enabled_emails_secret.value
    LEGAL_ENABLED_EMAILS_SECRET       = data.azurerm_key_vault_secret.askmebot_legal_enabled_emails_secret.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY = data.azurerm_key_vault_secret.askmebot_FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY.value
    SLACK_API_URL                     = local.common_config.askmebot.slack_api_url
    INSTITUTION_URL                   = local.common_config.askmebot.institution_url
    USERS_URL                         = local.common_config.askmebot.users_url
    CONTRACT_URL                      = local.common_config.askmebot.contract_url
    USERS_APIM_SUBSCRIPTION_KEY       = data.azurerm_key_vault_secret.askmebot_users_apim_subscription_key.value
    CONTRACT_APIM_SUBSCRIPTION_KEY    = data.azurerm_key_vault_secret.askmebot_contract_apim_subscription_key.value
    SMTP_HOST                         = local.common_config.askmebot.smtp_host
    SMTP_PORT                         = local.common_config.askmebot.smtp_port
    SMTP_SECURE                       = local.common_config.askmebot.smtp_secure
    SMTP_USERNAME                     = local.common_config.askmebot.smtp_username
    SMTP_PASSWORD                     = data.azurerm_key_vault_secret.askmebot_smtp_password.value
    FROM_EMAIL                        = local.common_config.askmebot.from_email
    CCN_EMAIL                         = local.common_config.askmebot.ccn_email
    MAX_DATA_LENGTH                   = local.common_config.askmebot.max_data_length
    APPINSIGHTS_CONNECTION_STRING     = data.azurerm_key_vault_secret.appinsights_connection_string.value
    APPINSIGHTS_INSTRUMENTATIONKEY    = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value
    APPINSIGHTS_SAMPLING_PERCENTAGE   = local.common_config.askmebot.appinsights_sampling_percentage
    NODE_ENV                          = local.env_config.askmebot.production.node_env
  }

  yaml_askmebot_func_slot_app_settings = {
    SERVICENAME                       = local.common_config.askmebot.service_name
    SLACK_BOT_TOKEN                   = data.azurerm_key_vault_secret.askmebot_slack_bot_token.value
    SLACK_SIGNING_SECRET              = data.azurerm_key_vault_secret.askmebot_slack_signing_secret.value
    ENABLED_EMAILS_SECRET             = data.azurerm_key_vault_secret.askmebot_enabled_emails_secret.value
    LEGAL_ENABLED_EMAILS_SECRET       = data.azurerm_key_vault_secret.askmebot_legal_enabled_emails_secret.value
    FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY = data.azurerm_key_vault_secret.askmebot_ocp_apim_subscription_key.value
    SLACK_API_URL                     = local.common_config.askmebot.slack_api_url
    INSTITUTION_URL                   = local.common_config.askmebot.institution_url
    USERS_URL                         = local.common_config.askmebot.users_url
    CONTRACT_URL                      = local.common_config.askmebot.contract_url
    USERS_APIM_SUBSCRIPTION_KEY       = data.azurerm_key_vault_secret.askmebot_users_apim_subscription_key.value
    CONTRACT_APIM_SUBSCRIPTION_KEY    = data.azurerm_key_vault_secret.askmebot_contract_apim_subscription_key.value
    SMTP_HOST                         = local.common_config.askmebot.smtp_host
    SMTP_PORT                         = local.common_config.askmebot.smtp_port
    SMTP_SECURE                       = local.common_config.askmebot.smtp_secure
    SMTP_USERNAME                     = local.common_config.askmebot.smtp_username
    SMTP_PASSWORD                     = data.azurerm_key_vault_secret.askmebot_smtp_password.value
    FROM_EMAIL                        = local.common_config.askmebot.from_email
    CCN_EMAIL                         = local.common_config.askmebot.ccn_email
    MAX_DATA_LENGTH                   = local.common_config.askmebot.max_data_length
    APPINSIGHTS_CONNECTION_STRING     = data.azurerm_key_vault_secret.appinsights_connection_string.value
    APPINSIGHTS_INSTRUMENTATIONKEY    = data.azurerm_key_vault_secret.appinsights_instrumentationkey.value
    APPINSIGHTS_SAMPLING_PERCENTAGE   = local.common_config.askmebot.appinsights_sampling_percentage
    NODE_ENV                          = local.env_config.askmebot.staging.node_env
  }

  # =============================================================================
  # 5. Backend SMCR App Service
  # =============================================================================

  yaml_backend_app_settings = {}

  yaml_backend_slot_app_settings = {}

  # =============================================================================
  # 6. Frontend FE-SMCR App Service (Next.js)
  # =============================================================================

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
    FE_SMCR_AZURE_STORAGE_CONTAINER                       = local.common_config.fe_smcr.azure_storage_container
    FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX = local.common_config.fe_smcr.azure_storage_onboarding_products_blob_prefix
    WEBHOOK_MANUAL_STORAGE                                = data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value
    STORAGE_TOKEN                                         = data.azurerm_key_vault_secret.fe_smcr_storage_token.value

    DB_HOST         = data.azurerm_key_vault_secret.db_host.value
    DB_USER         = data.azurerm_key_vault_secret.db_user.value
    DB_NAME         = local.common_config.fe_smcr.db_name
    DB_TABLE        = local.common_config.fe_smcr.db_table
    DB_PASSWORD_B64 = data.azurerm_key_vault_secret.db_password_b64.value
    DB_PORT         = local.common_config.database.port
    DB_SSL          = local.common_config.database.ssl

    SLACK_CALL_MANAGEMENT_HOOK_TEST = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value
    SLACK_CALL_MANAGEMENT_HOOK_PROD = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value

    GET_INFOCAMERE           = local.common_config.fe_smcr.get_infocamere
    GET_INSTITUTION          = local.common_config.fe_smcr.get_institution
    GET_IPA                  = local.common_config.fe_smcr.get_ipa
    GET_IPA_UO               = local.common_config.fe_smcr.get_ipa_uo
    GET_IPA_AOO              = local.common_config.fe_smcr.get_ipa_aoo
    GET_STATUS               = local.common_config.fe_smcr.get_status
    GET_USERS_PATH           = local.common_config.fe_smcr.get_users_path
    ONBOARDING_BASE_PATH     = local.common_config.fe_smcr.onboarding_base_path
    ONBOARDING_BASE_PATH_UAT = data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value
    UPLOAD                   = local.common_config.fe_smcr.upload

    TEST_ENDPOINT            = local.common_config.fe_smcr.testend

    NEXT_PUBLIC_APP_URL             = local.env_config.fe_smcr.production.next_public_app_url
    NEXT_PUBLIC_MSAL_REDIRECT_URI   = local.env_config.fe_smcr.production.next_public_msal_redirect_uri
    NEXT_PUBLIC_POST_LOGIN_REDIRECT = local.env_config.fe_smcr.production.next_public_post_login_redirect
    NEXT_PUBLIC_MSAL_CLIENT_ID      = data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_client_id.value
    NEXT_PUBLIC_MSAL_TENANT_ID      = data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_tenant_id.value
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
    FE_SMCR_AZURE_STORAGE_CONTAINER                       = local.common_config.fe_smcr.azure_storage_container
    FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX = local.common_config.fe_smcr.azure_storage_onboarding_products_blob_prefix
    WEBHOOK_MANUAL_STORAGE                                = data.azurerm_key_vault_secret.fe_smcr_webhook_manual_storage.value
    STORAGE_TOKEN                                         = data.azurerm_key_vault_secret.fe_smcr_storage_token.value

    DB_HOST         = data.azurerm_key_vault_secret.db_host.value
    DB_USER         = data.azurerm_key_vault_secret.db_user.value
    DB_NAME         = local.common_config.fe_smcr.db_name
    DB_TABLE        = local.common_config.fe_smcr.db_table
    DB_PASSWORD_B64 = data.azurerm_key_vault_secret.db_password_b64.value
    DB_PORT         = local.common_config.database.port
    DB_SSL          = local.common_config.database.ssl

    SLACK_CALL_MANAGEMENT_HOOK_TEST = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_test.value
    SLACK_CALL_MANAGEMENT_HOOK_PROD = data.azurerm_key_vault_secret.fe_smcr_slack_call_management_hook_prod.value

    GET_INFOCAMERE           = local.common_config.fe_smcr.get_infocamere
    GET_INSTITUTION          = local.common_config.fe_smcr.get_institution
    GET_IPA                  = local.common_config.fe_smcr.get_ipa
    GET_IPA_UO               = local.common_config.fe_smcr.get_ipa_uo
    GET_IPA_AOO              = local.common_config.fe_smcr.get_ipa_aoo
    GET_STATUS               = local.common_config.fe_smcr.get_status
    GET_USERS_PATH           = local.common_config.fe_smcr.get_users_path
    ONBOARDING_BASE_PATH     = local.common_config.fe_smcr.onboarding_base_path
    ONBOARDING_BASE_PATH_UAT = data.azurerm_key_vault_secret.fe_smcr_onboarding_base_path_uat.value
    UPLOAD                   = local.common_config.fe_smcr.upload

    TEST_ENDPOINT            = local.common_config.fe_smcr.testend


    NEXT_PUBLIC_APP_URL             = local.env_config.fe_smcr.staging.next_public_app_url
    NEXT_PUBLIC_MSAL_REDIRECT_URI   = local.env_config.fe_smcr.staging.next_public_msal_redirect_uri
    NEXT_PUBLIC_POST_LOGIN_REDIRECT = local.env_config.fe_smcr.staging.next_public_post_login_redirect
    NEXT_PUBLIC_MSAL_CLIENT_ID      = data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_client_id.value
    NEXT_PUBLIC_MSAL_TENANT_ID      = data.azurerm_key_vault_secret.fe_smcr_plsm_p_platformsm_tenant_id.value
  }

  # =============================================================================
  # 7. CRM Function (Dynamics CRM Integration)
  # =============================================================================

  yaml_crm_func_app_settings = {
    DYNAMICS_BASE_URL        = data.azurerm_key_vault_secret.dynamics_base_url.value
    DYNAMICS_URL_CONTACTS    = data.azurerm_key_vault_secret.dynamics_url_contacts.value
    NODE_ENV                 = local.env_config.crm_function.production.node_env
    WEBSITE_RUN_FROM_PACKAGE = local.env_config.crm_function.production.website_run_from_package
    DEBUG                    = local.env_config.crm_function.production.debug
  }

  yaml_crm_func_slot_app_settings = {
    DYNAMICS_BASE_URL        = data.azurerm_key_vault_secret.dynamics_base_url.value
    DYNAMICS_URL_CONTACTS    = data.azurerm_key_vault_secret.dynamics_url_contacts.value
    NODE_ENV                 = local.env_config.crm_function.staging.node_env
    WEBSITE_RUN_FROM_PACKAGE = local.env_config.crm_function.staging.website_run_from_package
    DEBUG                    = local.env_config.crm_function.staging.debug
  }

  # =============================================================================
  # Extract environment metadata from YAML
  # =============================================================================

  yaml_environment = {
    prefix          = local.env_config.environment.prefix
    env_short       = local.env_config.environment.env_short
    location        = local.env_config.environment.location
    instance_number = local.env_config.environment.instance_number
  }

  # Extract tags from YAML
  yaml_tags = local.env_config.tags
}
