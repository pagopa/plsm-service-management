# =============================================================================
# AUTO-GENERATED — NON modificare manualmente.
# Generato il: 2026-03-10 11:06
# Per aggiornare: python3 infra/scripts/generate_locals.py
# =============================================================================

data "azurerm_key_vault_secret" "fe_smcr_api_key_firma_con_io_signer_id" {
  name         = "fe-smcr-api-key-firma-con-io-signerid"
  key_vault_id = module.azure_core_infra.common_key_vault.id
}
