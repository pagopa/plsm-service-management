terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.62"
    }

    dx = {
      source  = "pagopa-dx/azure"
      version = ">= 0.12.0, < 1.0.0"
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

# Dalla v6 il modulo federa anche automation-prod-ci/cd e ci scrive i secret, ma non crea
# gli environment GitHub. automation-prod-cd lo crea infra/repository (github-environment-bootstrap
# 3.x), automation-prod-ci no: lo creiamo qui.
resource "github_repository_environment" "automation_ci" {
  repository  = local.repository.name
  environment = "automation-prod-ci"
}

module "azure-github-environment-bootstrap" {
  source      = "pagopa-dx/azure-github-environment-bootstrap/azurerm"
  version     = "6.2.3"
  environment = local.environment

  terraform_storage_account = {
    name                = "plsmpitntfst001"
    resource_group_name = "terraform-state-rg"
  }



  github_private_runner = {
    container_app_environment_id = data.azurerm_container_app_environment.runner.id

    key_vault = {
      name                = data.azurerm_key_vault.common_kv.name
      resource_group_name = data.azurerm_key_vault.common_kv.resource_group_name
      use_rbac            = true
    }

    labels = ["prod"]
  }

  entraid_groups = {
    admins_object_id    = data.azuread_group.admins.object_id,
    devs_object_id      = data.azuread_group.devs.object_id,
    externals_object_id = data.azuread_group.externals.object_id
  }

  private_dns_zone_resource_group_id = data.azurerm_resource_group.network_rg.id
  opex_resource_group_id             = data.azurerm_resource_group.opex_rg.id
  repository                         = local.repository

  additional_resource_group_ids = [
    data.azurerm_resource_group.apps_rg.id,
  ]

  tags = local.tags

  depends_on = [github_repository_environment.automation_ci]
}


resource "azurerm_role_assignment" "app_ci_website_contributor" {
  scope = data.azurerm_resource_group.common_rg.id

  role_definition_name = "Website Contributor"

  principal_id = module.azure-github-environment-bootstrap.identities.app.ci.principal_id

}

# L'identità CD infra deve poter aggiornare le risorse di core-infra nel common rg
# (Log Analytics, Key Vault, VNet...). Assegnazione puntuale e non tramite
# additional_resource_group_ids, che darebbe ruoli anche a devs, externals e identità app.
resource "azurerm_role_assignment" "infra_cd_common_contributor" {
  scope = data.azurerm_resource_group.common_rg.id

  role_definition_name = "Contributor"

  principal_id = module.azure-github-environment-bootstrap.identities.infra.cd.principal_id
}
