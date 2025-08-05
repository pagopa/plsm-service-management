locals {
  environment = {
    prefix          = "sm"        # Prefisso per team service management
    env_short       = "p"         # 'd' per dev, 'u' per uat, 'p' per prod
    location        = "italynorth"
    app_name        = "smcr"      # Nome dell'applicazione
    instance_number = "001"       # Numero di istanza (utile se ne hai più di una)
    domain          = "servicemanagement"
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