# =============================================================================
# Terraform Configuration
# =============================================================================

terraform {
  required_providers {
    azurerm = {
      # core-infra 4.4 richiede ~> 4.62; fissato per evitare salti a 4.8x (SMION-903)
      source  = "hashicorp/azurerm"
      version = "~> 4.62.0"
    }

    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }

    azapi = {
      source  = "azure/azapi"
      version = "~> 2.0"
    }


    dx = {
      # core-infra 4.4 richiede ~> 0.8; la 0.12 arriva con l'epica moduli DX
      source  = "pagopa-dx/azure"
      version = "~> 0.8.0"
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

provider "azuread" {}

provider "azapi" {}