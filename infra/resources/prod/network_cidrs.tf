# =============================================================================
# Network CIDR Calculations
# =============================================================================
# I CIDR vengono calcolati in sequenza per evitare sovrapposizioni.
# L'ordine dei depends_on definisce la catena di dipendenze.
#
# SMION-955: pfatt e onboarding usano la subnet di certificati, crm e signature
# quella di auth (due piani App Service condivisi): i loro CIDR dedicati sono
# stati rimossi.
# =============================================================================

# CIDR per l'Infrastruttura CORE
resource "dx_available_subnet_cidr" "core_infra_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
}

# CIDR per la Function App: Certificati (condivisa con pfatt e onboarding)
resource "dx_available_subnet_cidr" "function_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.azure_core_infra]
}

# CIDR per l'App Service FE-SMCR
resource "dx_available_subnet_cidr" "app_service_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.portalefatturazione_function]
}

# CIDR per la Function App: Auth (condivisa con crm e signature)
# Prima dipendeva da crm, che ora dipende da auth: agganciato al FE per non
# creare un ciclo. Cambiare depends_on non ricalcola il CIDR già assegnato.
resource "dx_available_subnet_cidr" "auth_fa_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.azure_fe_app_service_smcr]
}
