# =============================================================================
# YAML-Based Configuration Management
# =============================================================================
# This file implements YAML-based configuration for infrastructure resources.
# 
# Benefits:
# - Single source of truth for environment configurations
# - Easy to add new environments (just create new YAML file)
# - Reduced duplication between production/staging slots
# - Better separation between infrastructure code and configuration
# - Easier to review configuration changes in PRs
#
# Usage:
# 1. Define common settings in environments/common.yaml
# 2. Define environment-specific settings in environments/{env}.yaml
# 3. Terraform reads and merges these configurations at plan/apply time
#
# Note: This is a gradual migration approach. Currently only CRM Function uses
# YAML configuration. Other resources still use the traditional locals.tf approach.
# =============================================================================

# Load YAML configuration files
locals {
  # Read common configuration (shared across all environments)
  common_config = yamldecode(file("${path.module}/../environments/common.yaml"))

  # Read environment-specific configuration (prod, uat, etc.)
  env_config = yamldecode(file("${path.module}/../environments/prod.yaml"))

  # Extract common app settings from YAML
  yaml_common_app_settings = {
    DiagnosticServices_EXTENSION_VERSION            = local.common_config.app_insights.diagnostic_services_extension_version
    InstrumentationEngine_EXTENSION_VERSION         = local.common_config.app_insights.instrumentation_engine_extension_version
    SnapshotDebugger_EXTENSION_VERSION              = local.common_config.app_insights.snapshot_debugger_extension_version
    XDT_MicrosoftApplicationInsights_BaseExtensions = local.common_config.app_insights.xdt_microsoft_application_insights_base_extensions
    XDT_MicrosoftApplicationInsights_Mode           = local.common_config.app_insights.xdt_microsoft_application_insights_mode
    XDT_MicrosoftApplicationInsights_PreemptSdk     = local.common_config.app_insights.xdt_microsoft_application_insights_preempt_sdk
    TIMEOUT_DELAY                                   = local.common_config.common.timeout_delay
  }

  # Build CRM Function production app settings from YAML
  yaml_crm_func_app_settings = {
    DYNAMICS_BASE_URL        = data.azurerm_key_vault_secret.dynamics_base_url.value
    DYNAMICS_URL_CONTACTS    = data.azurerm_key_vault_secret.dynamics_url_contacts.value
    NODE_ENV                 = local.env_config.crm_function.production.node_env
    WEBSITE_RUN_FROM_PACKAGE = local.env_config.crm_function.production.website_run_from_package
    DEBUG                    = local.env_config.crm_function.production.debug
  }

  # Build CRM Function staging slot app settings from YAML
  yaml_crm_func_slot_app_settings = {
    DYNAMICS_BASE_URL        = data.azurerm_key_vault_secret.dynamics_base_url.value
    DYNAMICS_URL_CONTACTS    = data.azurerm_key_vault_secret.dynamics_url_contacts.value
    NODE_ENV                 = local.env_config.crm_function.staging.node_env
    WEBSITE_RUN_FROM_PACKAGE = local.env_config.crm_function.staging.website_run_from_package
    DEBUG                    = local.env_config.crm_function.staging.debug
  }

  # Extract environment metadata from YAML
  yaml_environment = {
    prefix          = local.env_config.environment.prefix
    env_short       = local.env_config.environment.env_short
    location        = local.env_config.environment.location
    instance_number = local.env_config.environment.instance_number
  }

  # Extract tags from YAML
  yaml_tags = local.env_config.tags
}
