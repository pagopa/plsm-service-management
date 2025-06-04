module "infra_federated_identity" {
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    instance_number = "01"
  }

  resource_group_name = "${local.project}-${local.domain}-rg"
  subscription_id     = data.azurerm_subscription.current.id

  repository = local.repository

  identity_type = "infra"

  continuos_integration = {
    enable = true
    roles = {
      subscription = ["Reader"]
      resource_groups = {
        "${local.project}-${local.domain}-rg" = ["Storage Blob Data Contributor"]
      }
    }
  }

  continuos_delivery = {
    enable = true
    roles = {
      subscription = ["Contributor"]
      resource_groups = {
        "${local.project}-${local.domain}-rg" = ["Storage Blob Data Contributor"]
      }
    }
  }

  tags = {}
}

module "app_federated_identity" {
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    instance_number = "01"
  }

  resource_group_name = "${local.project}-${local.domain}-rg"
  subscription_id     = data.azurerm_subscription.current.id

  repository = local.repository

  identity_type = "app"

  continuos_integration = {
    enable = true
    roles = {
      subscription = ["Reader"]
      resource_groups = {
        "${local.project}-${local.domain}-rg" = ["Storage Blob Data Contributor"]
      }
    }
  }

  continuos_delivery = {
    enable = true
    roles = {
      subscription = ["Contributor"]
      resource_groups = {
        "${local.project}-${local.domain}-rg" = ["Storage Blob Data Contributor"]
      }
    }
  }

  tags = {}
}
