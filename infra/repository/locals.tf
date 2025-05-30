locals {
  prefix         = "plsm"
  env_short      = "p"
  location_short = "itn"
  domain         = "sm"

  project = "${local.prefix}-${local.env_short}-${local.location_short}"

  location = "italynorth"

  repository = {
    name  = "plsm-service-management"
    owner = "pagopa"
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
