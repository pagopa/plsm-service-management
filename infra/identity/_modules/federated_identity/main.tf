

module "federated_identity" {
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "~> 1.0"

  environment = {
    prefix          = var.environment.prefix
    env_short       = var.environment.env_short
    location        = var.environment.location
    domain          = var.environment.domain
    instance_number = var.environment.instance_number
  }

  resource_group_name = var.resource_group_name
  subscription_id     = var.subscription_id

  repository = var.repository

  identity_type = var.identity_type

  continuos_integration = {
    enable = true
    roles = {
      subscription = ["Reader"]
      resource_groups = {
        "${var.resource_group_name}" = ["Storage Blob Data Contributor"]
      }
    }
  }

  continuos_delivery = {
    enable = true
    roles = {
      subscription = ["Contributor"]
      resource_groups = {
        "${var.resource_group_name}" = ["Storage Blob Data Contributor"]
      }
    }
  }

  tags = var.tags
}
