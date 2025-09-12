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
    storage_account_name = "plsmpitntfst001"
    container_name       = "terraform-state"
    key                  = "plsm-service-management.prod.bootstrapper.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {}
  storage_use_azuread = true
}

provider "github" {
  owner = "pagopa"
}

module "azure-github-environment-bootstrap" {
  source      = "pagopa-dx/azure-github-environment-bootstrap/azurerm"
  version     = "3.0.1"
  environment = local.environment

  subscription_id = data.azurerm_subscription.current.id
  tenant_id       = data.azurerm_client_config.current.tenant_id

  terraform_storage_account = {
    name                = "plsmpitntfst001"
    resource_group_name = "terraform-state-rg"
  }

  github_private_runner = {
    container_app_environment_id       = data.azurerm_container_app_environment.runner.id
    container_app_environment_location = data.azurerm_container_app_environment.runner.location

    key_vault = {
      name                = data.azurerm_key_vault.common_kv.name
      resource_group_name = data.azurerm_key_vault.common_kv.resource_group_name
    }
  }

  entraid_groups = {
    admins_object_id    = data.azuread_group.admins.object_id,
    devs_object_id      = data.azuread_group.devs.object_id,
    externals_object_id = data.azuread_group.externals.object_id
  }

  pep_vnet_id                        = data.azurerm_virtual_network.vnet.id
  private_dns_zone_resource_group_id = data.azurerm_resource_group.network_rg.id
  opex_resource_group_id             = data.azurerm_resource_group.opex_rg.id
  repository                         = local.repository


  tags = local.tags
}


resource "azurerm_role_assignment" "app_ci_website_contributor" {
  scope = data.azurerm_resource_group.common_rg.id

  role_definition_name = "Website Contributor"

  principal_id = module.azure-github-environment-bootstrap.identities.app.ci.principal_id

}
