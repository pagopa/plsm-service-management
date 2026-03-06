locals {
  environment = {
    prefix          = "plsm"
    env_short       = "d"
    location        = "italynorth"
    instance_number = "01"
  }

  instance_number = "01"

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Dev"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }

  common_app_settings = {
    DiagnosticServices_EXTENSION_VERSION            = "~3"
    InstrumentationEngine_EXTENSION_VERSION         = "disabled"
    SnapshotDebugger_EXTENSION_VERSION              = "disabled"
    XDT_MicrosoftApplicationInsights_BaseExtensions = "disabled"
    XDT_MicrosoftApplicationInsights_Mode           = "recommended"
    XDT_MicrosoftApplicationInsights_PreemptSdk     = "disabled"
    TIMEOUT_DELAY                                   = 300
  }

  # =============================================================================
  # YAML-BASED CONFIGURATION
  # =============================================================================
  # Le app settings sono generate da:
  #   infra/resources/environments/common.yaml (condiviso)
  #   infra/resources/environments/dev.yaml    (DEV-specifico)
  # Implementazione: infra/resources/dev/locals_yaml.tf
  # Per aggiornare: python3 infra/scripts/generate_locals.py --env dev
  # =============================================================================

  fe_smcr_app_settings      = local.yaml_fe_smcr_app_settings
  fe_smcr_slot_app_settings = local.yaml_fe_smcr_slot_app_settings
}
