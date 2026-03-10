terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4"
    }

    dx = {
      source  = "pagopa-dx/azure"
      version = ">= 0.0.7, < 1.0.0"
    }

    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }

    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "plsmditntfst001"
    container_name       = "terraform-state"
    key                  = "plsm-service-management.dev.bootstrapper.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {}
  storage_use_azuread = true
  subscription_id     = "2d2f0c09-adad-4118-8ef8-8bf737bdca76"
}

provider "github" {
  owner = "pagopa"
}

# Il modulo v3.0.1 non crea i github_repository_environment — li assume già esistenti.
# Li creiamo esplicitamente e usiamo depends_on per garantire l'ordine.
resource "github_repository_environment" "envs" {
  for_each = toset([
    "app-dev-ci",
    "app-dev-cd",
    "infra-dev-ci",
    "infra-dev-cd",
    "opex-dev-ci",
    "opex-dev-cd",
  ])

  repository  = local.repository.name
  environment = each.key
}

module "azure-github-environment-bootstrap" {
  source      = "pagopa-dx/azure-github-environment-bootstrap/azurerm"
  version     = "3.0.1"
  environment = local.environment

  subscription_id = data.azurerm_subscription.current.id
  tenant_id       = data.azurerm_client_config.current.tenant_id

  terraform_storage_account = {
    name                = "plsmditntfst001"
    resource_group_name = "terraform-state-rg"
  }

  github_private_runner = {
    container_app_environment_id       = data.azurerm_container_app_environment.runner.id
    container_app_environment_location = data.azurerm_container_app_environment.runner.location

    key_vault = {
      name                = data.azurerm_key_vault.common_kv.name
      resource_group_name = data.azurerm_key_vault.common_kv.resource_group_name
      use_rbac            = true
    }

    labels = ["dev"]
  }

  entraid_groups = {
    admins_object_id    = data.azuread_group.admins.object_id
    devs_object_id      = data.azuread_group.devs.object_id
    externals_object_id = data.azuread_group.externals.object_id
  }

  pep_vnet_id                        = data.azurerm_virtual_network.vnet.id
  private_dns_zone_resource_group_id = data.azurerm_resource_group.network_rg.id
  opex_resource_group_id             = data.azurerm_resource_group.opex_rg.id
  repository                         = local.repository

  additional_resource_group_ids = [
    data.azurerm_resource_group.apps_rg.id,
  ]

  tags = local.tags

  depends_on = [github_repository_environment.envs]
}
