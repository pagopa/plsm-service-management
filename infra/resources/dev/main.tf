terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.62"
    }

    azapi = {
      source  = "azure/azapi"
      version = "~> 2.0"
    }

    dx = {
      source  = "pagopa-dx/azure"
      version = ">= 0.12.0, < 1.0.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "plsmditntfst001"
    container_name       = "terraform-state"
    key                  = "plsm-service-management.dev.resources.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  storage_use_azuread = true
  features {}
}


provider "azapi" {}
