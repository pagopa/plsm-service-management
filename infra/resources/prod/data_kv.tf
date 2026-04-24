# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-04-24 11:11
# Per aggiornare: python3 infra/scripts/generate_locals.py --env prod
# =============================================================================

data "azurerm_key_vault_secret" "crm_products_map_prod" {
  name         = "crm-products-map-prod"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "crm_products_map_uat" {
  name         = "crm-products-map-uat"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "crm_tipologia_referente_map" {
  name         = "crm-tipologia-referente-map"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "diagnostics_storage_connection_string" {
  name         = "diagnostics-storage-connection-string"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "dynamics_base_url_uat" {
  name         = "dynamics-base-url-uat"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "dynamics_url_contacts_uat" {
  name         = "dynamics-url-contacts-uat"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_cert_api_key" {
  name         = "fe-cert-api-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_certificati" {
  name         = "fe-smcr-api-key-certificati"
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
