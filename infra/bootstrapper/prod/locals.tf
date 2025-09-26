locals {
  environment = {
    prefix    = "plsm" # Prefisso per team service management
    env_short = "p"  # 'd' per dev, 'u' per uat, 'p' per prod
    location  = "italynorth"
    # app_name        = "smcr" # Nome dell'applicazione
    instance_number = "01" # Numero di istanza (utile se ne hai più di una)
    domain          = "sm"
  }
#plsm-p-itn-plsm-service-man-caj-01
  adgroups = {
    admins_name    = "plsm-p-adgroup-admin"
    devs_name      = "plsm-p-adgroup-developers"
    externals_name = "plsm-p-adgroup-externals"
  }

  repository = {
    # --- Campi Obbligatori ---
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

  repo_secrets = {
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id,
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id
  }



  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }
}
