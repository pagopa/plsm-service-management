locals {
  full_prefix    = "plsm"
  prefix         = "sm"
  module_prefix  = substr(local.full_prefix, 2, 2)
  env_short      = "p"
  location_short = "itn"
  domain         = "core"
  project        = "${local.full_prefix}-${local.env_short}-${local.location_short}"
  location       = "italynorth"

  repository = {
    name  = "plsm-service-management"
    owner = "pagopa"
  }

  repo_secrets = {
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id,
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id
  }

  # CONFIGURAZIONE SEMPLIFICATA: solo 4 ambienti
  environments = {
    # INFRA: CI/CD per gestione infrastruttura
    infra-ci = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.infra_federated_identity.federated_ci_identity.client_id
      }
      protected_branches = false
    }
    infra-cd = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.infra_federated_identity.federated_cd_identity.client_id
      }
      protected_branches = true  # Solo apply su branch protetti
    }

    # APP: Deploy applicazioni DEV/PROD
    dev = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.app_federated_identity.federated_ci_identity.client_id
      }
      protected_branches = false
    }
    prod = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.app_federated_identity.federated_cd_identity.client_id
      }
      protected_branches = true
    }
  }

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }
}