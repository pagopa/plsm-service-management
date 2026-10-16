terraform {
  required_providers {
    azurerm = {
      # < 4.66: dalla 4.66 il provider riaccende local_authentication_enabled sul
      # Log Analytics di core-infra. Vedi SMION-890.
      source  = "hashicorp/azurerm"
      version = ">= 4.62, < 4.66"
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
    key                  = "plsm-service-management.dev.base.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  storage_use_azuread = true
  features {}
}
