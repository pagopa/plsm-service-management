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
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }




  }
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "plsmpitntfst001"
    container_name       = "terraform-state"
    key                  = "plsm-service-management.repository.tfstate"
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

module "github_environment_bootstrap" {
  source  = "pagopa-dx/github-environment-bootstrap/github"
  version = "0.1.1"

  repository = {
    name                = "plsm-service-management"
    description         = "Official repository for PLSM"
    topics              = ["terraform", "github", "servicemanagement"]
    default_branch_name = "main"
    jira_boards_ids     = ["ISS"]
  }
}
