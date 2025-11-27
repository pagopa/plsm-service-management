data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}



data "azuread_group" "keyvault_admin_group" {
  # Usa il nome visualizzato per recuperare l'Object ID
  display_name = "plsm-p-adgroup-admin"
}

data "azurerm_key_vault_secret" "fe_smcr_plsm_p_platformsm_tenant_id" {
  name         = "fe-smcr-plsm-p-platformsm-tenant-id"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_plsm_p_platformsm_client_id" {
  name         = "fe-smcr-plsm-p-platformsm-client-id"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
data "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "APPINSIGHTS-CONNECTION-STRING"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "appinsights_instrumentationkey" {
  name         = "APPINSIGHTS-INSTRUMENTATIONKEY"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}


# Database PostgreSQL
data "azurerm_key_vault_secret" "db_host" {
  name         = "db-host"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "db_user" {
  name         = "postgres-username"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "db_password" {
  name         = "postgres-password"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}



data "azurerm_user_assigned_identity" "github_cd_identity" {
  # Assicurati che questo sia il resource group dove hai creato le identità
  resource_group_name = "plsm-p-itn-sm-rg-01"
  name                = "plsm-p-itn-sm-app-github-cd-id-01"
}
data "azurerm_user_assigned_identity" "github_ci_identity" {
  # Assicurati che questo sia il resource group dove hai creato le identità
  resource_group_name = "plsm-p-itn-sm-rg-01"
  name                = "plsm-p-itn-sm-app-github-ci-id-01"
}

data "azurerm_linux_function_app" "plsm_cert_func" {
  name                = "plsm-p-itn-cert-func-01"
  resource_group_name = "plsm-p-itn-fn-rg-01"
}

// Variabili FE_SMCR
data "azurerm_key_vault_secret" "fe_smcr_users_api_key" {
  name         = "fe-smcr-users-api-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_ocp_apim_subscription_key" {
  name         = "fe-smcr-ocp-apim-subscription-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_institution" {
  name         = "fe-smcr-api-key-institution"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_prod_get_users" {
  name         = "fe-smcr-api-key-prod-get-users"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_services" {
  name         = "fe-smcr-api-key-services"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_pnpg" {
  name         = "fe-smcr-api-key-pnpg"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_firma_con_io" {
  name         = "fe-smcr-api-key-firma-con-io"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_report_hook" {
  name         = "fe-smcr-slack-report-hook"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_call_management_hook" {
  name         = "fe-smcr-slack-call-management-hook"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_call_management_hook_test" {
  name         = "fe-smcr-slack-call-management-hook-test"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_slack_call_management_hook_prod" {
  name         = "fe-smcr-slack-call-management-hook-prod"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}


# Function Onboarding

data "azurerm_key_vault_secret" "sc_contracts_conn_string" {
  name         = "fa-onboarding-sc-contracts-conn-string"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "slack_webhook_log" {
  name         = "fa-onboarding-slack-webhook-log"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "slack_webhook_onboarding_io" {
  name         = "fa-onboarding-slack-webhook-onboarding-io"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "slack_webhook_onboarding_pn" {
  name         = "fa-onboarding-slack-webhook-onboarding-pn"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "slack_webhook_onboarding_interop" {
  name         = "fa-onboarding-slack-webhook-onboarding-interop"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY" {
  name         = "fa-onboarding-ocp-apim-subscription-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "slack_webhook_onboarding_io_premium" {
  name         = "fa-onboarding-slack-webhook-onboarding-io-premium"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "slack_webhook_onboarding_pagopa" {
  name         = "fa-onboarding-slack-webhook-onboarding-pagopa"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}


# Function Ask Me Bot

data "azurerm_key_vault_secret" "askmebot_slack_bot_token" {
  name         = "fa-askmebot-slack-bot-token"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "askmebot_slack_signing_secret" {
  name         = "fa-askmebot-slack-signing-secret"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "askmebot_enabled_emails_secret" {
  name         = "fa-askmebot-enabled-emails-secret"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "askmebot_legal_enabled_emails_secret" {
  name         = "fa-askmebot-legal-enabled-emails-secret"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "askmebot_FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY" {
  name         = "fa-askmebot-ocp-apim-subscription-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "askmebot_users_apim_subscription_key" {
  name         = "fa-askmebot-users-apim-subscription-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "askmebot_contract_apim_subscription_key" {
  name         = "fa-askmebot-contract-apim-subscription-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "askmebot_smtp_password" {
  name         = "fa-askmebot-smtp-password"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
