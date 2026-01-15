# =============================================================================
# Terraform Configuration
# =============================================================================

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4"
    }

    azapi = {
      source  = "azure/azapi"
      version = "~> 2.0"
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

# =============================================================================
# Providers
# =============================================================================

provider "azurerm" {
  storage_use_azuread = true
  features {}
}

provider "azapi" {}