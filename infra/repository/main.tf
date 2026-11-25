terraform {
  required_providers {
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

provider "github" {
  owner = "pagopa"
}

module "github_environment_bootstrap" {
  source  = "pagopa-dx/github-environment-bootstrap/github"
  version = "3.0.1"

  repository = {
    name                = "plsm-service-management"
    description         = "Official repository for PLSM"
    topics              = ["terraform", "github", "servicemanagement"]
    default_branch_name = "main"
    jira_boards_ids     = ["ISS"]
    reviewers_teams     = ["plsm-team-admins", "plsm-team-members", "plsm-team-externals"]
    # Le Issue sono in uso (es. le [Security]): il default del modulo è false
    has_issues = true
  }

}
