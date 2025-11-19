data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "APPINSIGHTS-CONNECTION-STRING"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "appinsights_instrumentationkey" {
  name         = "APPINSIGHTS-INSTRUMENTATIONKEY"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

# data "azurerm_storage_account" "portalefatturazione_storage" {
#   name                = "fatppublic"         # qui devo farmi dare il name dello storage
#   resource_group_name = "fat-p-analytics-rg" # qui invece inserisco il resource group dello storage
# }

# data "azurerm_storage_container" "portalefatturazione_container" {
#   name               = "example-container-name"
#   storage_account_id = data.azurerm_storage_account.example.id
# }

# data "azurerm_resource_group" "common_rg" {
#   name = "sm-p-itn-common-rg-01"
# }
# data "azurerm_subnet" "pep_subnet" {
#   name                 = "pep_snet"
#   virtual_network_name = "sm-p-itn-common-vnet-01"
#   resource_group_name  = "sm-p-itn-network-rg-01"
# }

# data "azurerm_virtual_network" "vnet" {
#   name                = "sm-p-itn-common-vnet-01"
#   resource_group_name = "sm-p-itn-network-rg-01"
# }


# SMCR WEB APP
# data "azurerm_key_vault_secret" "slack_report_hook" {
#   name         = "SLACK-REPORT-HOOK"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }
# data "azurerm_key_vault_secret" "user_apim_subscription_key" {
#   name         = "USER-APIM-SUBSCRIPTION-KEY"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "users_api_key" {
#   name         = "USERS-API-KEY"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "ocp_apim_subscription_key" {
#   name         = "OCP-APIM-SUBSCRIPTION-KEY"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "subscription_key_selfcare" {
#   name         = "SUBSCRIPTION-KEY-SELFCARE"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "api_key_institution" {
#   name         = "API-KEY-INSTITUTION"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "api_key_prod_get_infocamere" {
#   name         = "API-KEY-PROD-GET-INFOCAMERE"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "api_key_prod_get_institution" {
#   name         = "API-KEY-PROD-GET-INSTITUTION"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "api_key_prod_get_ipa" {
#   name         = "API-KEY-PROD-GET-IPA"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "api_key_prod_get_users" {
#   name         = "API-KEY-PROD-GET-USERS"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

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
# data "azurerm_key_vault_secret" "db_password_b64" {
#   name         = "DB-PASSWORD-B64"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "next_public_msal_client_id" {
#   name         = "NEXT-PUBLIC-MSAL-CLIENT-ID"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

# data "azurerm_key_vault_secret" "next_public_msal_tenant_id" {
#   name         = "NEXT-PUBLIC-MSAL-TENANT-ID"
#   key_vault_id = module.azure_core_infra.common_key_vault.id
# }

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

data "azurerm_key_vault_secret" "ocp_apim_subscription_key" {
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

data "azurerm_key_vault_secret" "askmebot_ocp_apim_subscription_key" {
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
