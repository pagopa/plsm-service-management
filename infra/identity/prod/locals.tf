locals {
  environment = {
    prefix         = "sm"
    env_short      = "p"
    env            = "prod"
    domain         = "plsm-identity"
    location       = "italynorth"
    location_short = "itn"
  }

  project = "${local.environment.prefix}-${local.environment.env_short}"

  repository = {
    name  = "plsm-service-management"
    owner = "pagopa"
  }

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/blob/main/infra/identity/prod"
  }
}
