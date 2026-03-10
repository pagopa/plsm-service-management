locals {
  environment = {
    prefix          = "plsm" # Prefisso per team service management
    env_short       = "p"    # 'd' per dev, 'u' per uat, 'p' per prod
    location        = "italynorth"
    instance_number = "01" # Numero di istanza (utile se ne hai più di una)
    # domain          = "sm"
  }

  instance_number = "01"

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "PLSM"
    ManagementTeam = "Service Management"
    Source         = "https://github.com/pagopa/plsm-service-management/tree/main"
  }

  dns_default_ttl_sec       = 3600
  enable_smcr_custom_domain = true

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
  # YAML-BASED CONFIGURATION FOR ALL 6 APPLICATIONS
  # =============================================================================
  # All application settings have been migrated to YAML-based configuration.
  # See: infra/resources/environments/common.yaml (shared config)
  # See: infra/resources/environments/prod.yaml (environment-specific config)
  # Implementation: infra/resources/prod/locals_yaml.tf
  #
  # Benefits:
  # - Single source of truth for configurations
  # - Easy to add/modify settings without touching Terraform
  # - Better separation of concerns (infra code vs config data)
  # - Self-service for colleagues: edit YAML and create PR
  # =============================================================================

  # 1. Portale Fatturazione
  pf_app_settings      = local.yaml_pf_func_app_settings
  pf_slot_app_settings = local.yaml_pf_func_slot_app_settings

  # 2. Certificates Function
  certificates_func_app_settings      = local.yaml_certificates_func_app_settings
  certificates_slot_func_app_settings = local.yaml_certificates_func_slot_app_settings

  # 3. Onboarding Function
  onboarding_func_app_settings      = local.yaml_onboarding_func_app_settings
  onboarding_slot_func_app_settings = local.yaml_onboarding_func_slot_app_settings

  # 4. Ask Me Bot Function (Exposed)
  askmebot_func_app_settings      = local.yaml_askmebot_func_app_settings
  askmebot_func_slot_app_settings = local.yaml_askmebot_func_slot_app_settings

  # 5. Backend SMCR App Service
  backend_app_settings      = local.yaml_backend_app_settings
  backend_slot_app_settings = local.yaml_backend_slot_app_settings

  # 6. Frontend FE-SMCR App Service
  fe_smcr_app_settings      = local.yaml_fe_smcr_app_settings
  fe_smcr_slot_app_settings = local.yaml_fe_smcr_slot_app_settings

  # 7. CRM Function (Dynamics)
  crm_func_app_settings      = local.yaml_crm_func_app_settings
  crm_func_slot_app_settings = local.yaml_crm_func_slot_app_settings

  # 8. Auth Function
  auth_func_app_settings      = local.yaml_auth_func_app_settings
  auth_slot_func_app_settings = local.yaml_auth_func_slot_app_settings


  # OLD HARDCODED CONFIGURATION (COMMENTED OUT FOR REFERENCE)
  # crm_func_app_settings = {
  #   DYNAMICS_BASE_URL     = "${data.azurerm_key_vault_secret.dynamics_base_url.value}"
  #   DYNAMICS_URL_CONTACTS = "${data.azurerm_key_vault_secret.dynamics_url_contacts.value}"
  #   NODE_ENV              = "production"
  #   WEBSITE_RUN_FROM_PACKAGE = 1
  # }
  #
  # crm_func_slot_app_settings = {
  #   DYNAMICS_BASE_URL     = "${data.azurerm_key_vault_secret.dynamics_base_url.value}"
  #   DYNAMICS_URL_CONTACTS = "${data.azurerm_key_vault_secret.dynamics_url_contacts.value}"
  #   NODE_ENV              = "production"
  #   WEBSITE_RUN_FROM_PACKAGE = 1
  # }


}
