# =============================================================================
# Network CIDR Calculations
# =============================================================================
# I CIDR vengono calcolati in sequenza per evitare sovrapposizioni.
# L'ordine dei depends_on definisce la catena di dipendenze.
# =============================================================================

# CIDR per l'Infrastruttura CORE
resource "dx_available_subnet_cidr" "core_infra_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
}

# CIDR per la Function App: Certificati
resource "dx_available_subnet_cidr" "function_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.azure_core_infra]
}

# CIDR per la Function App: Onboarding
resource "dx_available_subnet_cidr" "onboarding_fa_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.certifica_function]
}

# CIDR per la Function App: Portale Fatturazione
resource "dx_available_subnet_cidr" "pf_fa_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.onboarding_function]
}

# CIDR per la Function App: ASK ME Everything
# resource "dx_available_subnet_cidr" "askmebot_fa_subnet_cidr" {
#   virtual_network_id = module.azure_core_infra.common_vnet.id
#   prefix_length      = 24
#   depends_on         = [module.portalefatturazione_function]
# }

# CIDR per la WEB APP di Backend BSMCR
resource "dx_available_subnet_cidr" "app_backend_service_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.askmebot_function]
}

# CIDR per l'App Service FE-SMCR
resource "dx_available_subnet_cidr" "app_service_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.azure_app_service_backend_smcr]
}

# CIDR per la Function App: CRM
resource "dx_available_subnet_cidr" "crm_fa_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.azure_fe_app_service_smcr]
}