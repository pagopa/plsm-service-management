# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-04-02 09:47
# Per aggiornare: python3 infra/scripts/generate_locals.py --env prod
# =============================================================================

data "azurerm_key_vault_secret" "fe_cert_api_key" {
  name         = "fe-cert-api-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_firma_con_io_signer_id" {
  name         = "fe-smcr-api-key-firma-con-io-signerid"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_institution_uat" {
  name         = "fe-smcr-api-key-institution-uat"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_crm_api_key" {
  name         = "fe-smcr-crm-api-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_crm_api_url" {
  name         = "fe-smcr-crm-api-url"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_logs_endpoint" {
  name         = "fe-smcr-logs-endpoint"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
