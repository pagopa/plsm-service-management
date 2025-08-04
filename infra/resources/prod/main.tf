terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4"
    }

    dx = {
      source  = "pagopa-dx/azure"
      version = ">= 0.0.6, < 1.0.0"
    }

  }
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "plsmpitntfst001"
    container_name       = "terraform-state"
    key                  = "plsm-service-management.prod.resources.tfstate"
    use_azuread_auth     = true
  }

}

provider "azurerm" {
  features {}
}

module "azure-core-infra" {
  source  = "pagopa-dx/azure-core-infra/azurerm"
  version = "2.1.1"
  # insert the 2 required variables here
  environment = local.environment
  tags        = local.tags
}
