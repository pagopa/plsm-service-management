locals {
  prefix         = "sm"  # Platform Service Management
  env_short      = "p"   # Production
  location_short = "itn" # Italy North
  domain         = "sm"

  # Per far girare in locale metti plsm al posto ${local.prefix}
  project = "plsm-${local.env_short}-${local.location_short}"

  location = "italynorth"

  repository = {
    name  = "plsm-service-management"
    owner = "pagopa"
  }

  repo_secrets = {
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id,
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id
  }


  # PROD: prod-cd, prod-ci, infra-prod, infra-prod-ci
  # DEV: CI.Variables, CI.Secrets, CD.Variables, CD.secrets
  dev = {
    ci = {
      protected_branches     = false
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.azure_federated_identity_with_github.federated_ci_identity.client_id
      }
    }
    cd = {
      protected_branches     = false
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.azure_federated_identity_with_github.federated_cd_identity.client_id
      }
    }
    app-ci = {
      protected_branches     = false
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        ARM_CLIENT_ID = module.azure_federated_identity_with_github.federated_ci_identity.client_id
      }
    }
    app-cd = {
      protected_branches     = false
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        ARM_CLIENT_ID = module.azure_federated_identity_with_github.federated_cd_identity.client_id
      }
    }

  }

  prod = {
    ci = {
      protected_branches     = true
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.azure_federated_identity_with_github.federated_ci_identity.client_id
      }
    }
    cd = {
      protected_branches     = true
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        "ARM_CLIENT_ID" = module.azure_federated_identity_with_github.federated_cd_identity.client_id
      }
    }

    # Ambiente per DEPLOY applicativo (non solo infra)
    app-ci = {
      protected_branches     = false
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        ARM_CLIENT_ID = module.azure_federated_identity_with_github.federated_ci_identity.client_id
      }
    }
    app-cd = {
      protected_branches     = true
      custom_branch_policies = false
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      variables = {
        "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
      }
      secrets = {
        ARM_CLIENT_ID = module.azure_federated_identity_with_github.federated_cd_identity.client_id
      }
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
