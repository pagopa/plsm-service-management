locals {
  environment = {
    prefix          = "plsm"
    env_short       = "d"
    location        = "italynorth"
    instance_number = "01"
    domain          = "sm"
  }

  adgroups = {
    admins_name    = "plsm-d-adgroup-admin"
    devs_name      = "plsm-d-adgroup-developers"
    externals_name = "plsm-d-adgroup-externals"
  }

  repository = {
    name            = "plsm-service-management"
    description     = "Repository per il progetto Service Management"
    topics          = ["terraform", "azure", "servicemanagement", "pagopa"]
    reviewers_teams = ["plsm-team-admins", "plsm-team-members", "plsm-team-externals"]

    owner               = "pagopa"
    default_branch_name = "main"
    jira_boards_ids     = ["ISS"]

    app_cd_policy_branches   = ["main"]
    infra_cd_policy_branches = ["main"]
  }

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Dev"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }
}
