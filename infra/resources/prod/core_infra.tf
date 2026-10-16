# =============================================================================
# Core Infrastructure
# =============================================================================

module "azure_core_infra" {
  source  = "pagopa-dx/azure-core-infra/azurerm"
  version = "~> 4.4"

  environment = merge(local.environment, {
    app_name        = "smcr",
    instance_number = "01"
  })

  nat_enabled = false

  # Spenta per ricreare il gateway come VpnGw2AZ Gen2 (SMION-903): si riaccende nell'apply successivo
  vpn_enabled = false

  test_enabled = false

  tags = local.tags
}

# =============================================================================
# Resource Groups
# =============================================================================

resource "azurerm_resource_group" "fn_rg" {
  name     = "plsm-p-itn-fn-rg-01"
  location = "Italy North"
}

resource "azurerm_resource_group" "apps_rg" {
  name     = "plsm-p-itn-apps-rg-01"
  location = "Italy North"
}

resource "azurerm_resource_group" "ext_rg" {
  name     = "plsm-p-itn-ext-rg-01"
  location = "Italy North"
}

# =============================================================================
# Key Vault Role Assignment
# =============================================================================

resource "azurerm_role_assignment" "kv_group_secrets_officer" {
  scope                = module.azure_core_infra.common_key_vault.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azuread_group.keyvault_admin_group.object_id
}