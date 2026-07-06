# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-07-06 15:43
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

data "azurerm_key_vault_secret" "crm_tipologia_referente_map_prod" {
  name         = "crm-tipologia-referente-map-prod"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "crm_tipologia_referente_map_uat" {
  name         = "crm-tipologia-referente-map-uat"
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

data "azurerm_key_vault_secret" "fe_smcr_api_key_subscription_key_billing_portal" {
  name         = "fe-smcr-api-key-subscription-key-billing-portal"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_api_key_utenti_io" {
  name         = "fe-smcr-api-key-utenti-io"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_azure_storage_container_firma_con_io" {
  name         = "fe-smcr-azure-storage-container-firma-con-io"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_azure_storage_container_wallet" {
  name         = "fe-smcr-azure-storage-container-wallet"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_azure_storage_firma_con_io_blob_prefix" {
  name         = "fe-smcr-azure-storage-firma-con-io-blob-prefix"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_azure_storage_wallet_blob_prefix" {
  name         = "fe-smcr-azure-storage-wallet-blob-prefix"
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

data "azurerm_key_vault_secret" "fe_smcr_pdnd_api_base_url" {
  name         = "fe-smcr-pdnd-api-base-url"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_auth_token_url" {
  name         = "fe-smcr-pdnd-auth-token-url"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_client_assertion_audience" {
  name         = "fe-smcr-pdnd-client-assertion-audience"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_client_assertion_kid" {
  name         = "fe-smcr-pdnd-client-assertion-kid"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_client_assertion_private_key" {
  name         = "fe-smcr-pdnd-client-assertion-private-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_client_assertion_ttl_seconds" {
  name         = "fe-smcr-pdnd-client-assertion-ttl-seconds"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_client_id" {
  name         = "fe-smcr-pdnd-client-id"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_dpop_private_key" {
  name         = "fe-smcr-pdnd-dpop-private-key"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_env" {
  name         = "fe-smcr-pdnd-env"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_request_timeout_ms" {
  name         = "fe-smcr-pdnd-request-timeout-ms"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}

data "azurerm_key_vault_secret" "fe_smcr_pdnd_token_refresh_margin_seconds" {
  name         = "fe-smcr-pdnd-token-refresh-margin-seconds"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
