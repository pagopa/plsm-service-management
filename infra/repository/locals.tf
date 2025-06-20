locals {
  environment = {
    prefix         = "sm"
    env_short      = "p"
    env            = "prod"
    domain         = "plsm-identity"
    location       = "italynorth"
    location_short = "itn"
  }

  project = "${local.environment.prefix}-${local.environment.env_short}-${local.environment.location_short}"

  identity_resource_group_name = "${local.project}-plsm-identity-rg"

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
        "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.infra_identity_prod_ci.client_id
      }
      protected_branches = false
    }
    infra-cd = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.infra_identity_prod_cd.client_id
      }
      protected_branches = true # Solo apply su branch protetti
    }

    # APP: Deploy applicazioni DEV/PROD
    dev-ci = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.app_identity_prod_ci.client_id
      }
      protected_branches = false
    }
    dev-cd = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.app_identity_prod_cd.client_id
      }
      protected_branches = true
    }

    prod-ci = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.app_identity_prod_ci.client_id
      }
      protected_branches = false
    }
    prod-cd = {
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.app_identity_prod_cd.client_id
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
