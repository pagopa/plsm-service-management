terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>4"
    }

    dx = {
      source  = "pagopa-dx/azure"
      version = ">= 0.0.6, < 1.0.0"
    }

  }
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "plsmpitntfst001"
    container_name       = "terraform-state"
    key                  = "plsm-service-management.prod.resources.tfstate"
    use_azuread_auth     = true
  }

}

provider "azurerm" {
  storage_use_azuread = true
  features {}
}

# CALCOLO DEI CIDR

# Calcola un CIDR per l'Infrastruttura CORE
resource "dx_available_subnet_cidr" "core_infra_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
}

# Calcola un CIDR per la Function App: Certificati
resource "dx_available_subnet_cidr" "function_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.azure_core_infra]
}

# Calcola un CIDR per la Function App: Onboarding
resource "dx_available_subnet_cidr" "onboarding_fa_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  # depends_on         = [module.azure_app_service_smcr]
  depends_on = [module.certifica_function]
}

# Calcola un CIDR per la Function App: Portale Fatturazione
resource "dx_available_subnet_cidr" "pf_fa_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.onboarding_function]
}

# Calcola un CIDR per la Function App: ASK ME Everything
resource "dx_available_subnet_cidr" "askmebot_fa_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.portalefatturazione_function]
}

# Calcola un CIDR per la WEB APP di Backend b-smcr
resource "dx_available_subnet_cidr" "app_backend_service_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.askmebot_function]
}

# Calcola un CIDR per la WEB APP di Fronted f-smcr
# resource "dx_available_subnet_cidr" "app_frontend_service_subnet_cidr" {
#   virtual_network_id = module.azure_core_infra.common_vnet.id
#   prefix_length      = 24
#   depends_on         = [module.azure_app_service_backend_smcr]
# }

# Calcola un CIDR per l'App Service fe-smcr
resource "dx_available_subnet_cidr" "app_service_subnet_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24
  depends_on         = [module.azure_app_service_backend_smcr]
}

# ROLE ASSIGNMENT

resource "azurerm_role_assignment" "kv_group_secrets_officer" {
  scope                = module.azure_core_infra.common_key_vault.id
  role_definition_name = "Key Vault Secrets Officer"

  principal_id = data.azuread_group.keyvault_admin_group.object_id
}

module "azure_core_infra" {
  source  = "pagopa-dx/azure-core-infra/azurerm"
  version = "2.2.1"

  environment = merge(local.environment, {
    app_name        = "smcr",
    instance_number = "01"
  })

  nat_enabled = false

  vpn_enabled = true

  test_enabled = false

  tags = local.tags
}

resource "azurerm_resource_group" "fn_rg" {
  name     = "plsm-p-itn-fn-rg-01"
  location = "Italy North"
}

resource "azurerm_resource_group" "apps_rg" {
  name     = "plsm-p-itn-apps-rg-01"
  location = "Italy North"
}

resource "azurerm_role_assignment" "cd_identity_website_contributor_on_func" {
  scope                = data.azurerm_linux_function_app.plsm_cert_func.id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
}

# Azure Function per Certificati

module "certifica_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "cert",
    instance_number = "01"
  })


  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.network_resource_group_name
  }
  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.function_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.certificates_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.certificates_slot_func_app_settings)

  depends_on = [module.azure_core_infra]
}

# Azure Function per Portale Fatturazione

resource "azurerm_role_assignment" "cd_identity_website_contrib_pf_fa" {
  scope                = module.portalefatturazione_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
  depends_on           = [module.portalefatturazione_function]
}

module "portalefatturazione_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "pfatt",
    instance_number = "01"
  })


  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.network_resource_group_name
  }
  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.pf_fa_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.pf_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.pf_slot_app_settings)

  depends_on = [module.azure_core_infra]
}

# Azure Function per Onboarding

resource "azurerm_role_assignment" "cd_identity_website_contrib_onboardng_fa" {
  scope                = module.onboarding_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
  depends_on           = [module.onboarding_function]
}

module "onboarding_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "onboarding",
    instance_number = "01"
  })


  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.network_resource_group_name
  }
  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.onboarding_fa_subnet_cidr.cidr_block

  health_check_path = "/api/v1/health"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.onboarding_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.onboarding_slot_func_app_settings)

  depends_on = [module.azure_core_infra]
}

resource "azurerm_private_endpoint" "onboarding_func_to_selc_eventhub" {
  name                = "plsm-p-itn-selc-evhns-pep-01"
  location            = "Italy North"
  resource_group_name = "plsm-p-itn-network-rg-01"

  # ID della subnet, ora completo con il nome corretto
  subnet_id = "/subscriptions/c703d239-22b7-4d1a-9433-145daa884c10/resourceGroups/plsm-p-itn-network-rg-01/providers/Microsoft.Network/virtualNetworks/plsm-p-itn-common-vnet-01/subnets/plsm-p-itn-pep-snet-01"

  private_service_connection {
    name = "plsm-p-itn-selc-evhns-psc-01"

    private_connection_resource_id = "/subscriptions/${var.eventhub_subscription_id}/resourceGroups/selc-p-event-rg/providers/Microsoft.EventHub/namespaces/selc-p-eventhub-ns"

    is_manual_connection = true

    request_message   = "Connessione da Azure Function 'plsm-p-itn-onboarding-func-01' per Onboarding"
    subresource_names = ["namespace"]
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = ["/subscriptions/${var.subscription_id}/resourceGroups/plsm-p-itn-network-rg-01/providers/Microsoft.Network/privateDnsZones/privatelink.servicebus.windows.net"]
  }
}

# Ask Me Everything BOT

resource "azurerm_role_assignment" "cd_identity_website_contrib_askmebot_fa" {
  scope                = module.askmebot_function.function_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
  depends_on           = [module.askmebot_function]
}

module "askmebot_function" {
  source = "../_modules/function_app_exposed"

  environment = merge(local.environment, {
    app_name        = "askmebot",
    instance_number = "01"
  })


  resource_group_name = azurerm_resource_group.fn_rg.name
  tags                = local.tags

  health_check_path = "/api/v1/info"
  node_version      = 22
  app_settings      = merge(local.common_app_settings, local.askmebot_func_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.askmebot_func_slot_app_settings)

  depends_on = [module.azure_core_infra]
}

# App Service Backend

resource "azurerm_role_assignment" "cd_identity_website_contrib_backend_smcr" {
  scope                = module.azure_app_service_backend_smcr.web_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
  depends_on           = [module.azure_app_service_backend_smcr]
}

resource "azurerm_role_assignment" "ci_identity_website_contrib_backend_smcr" {
  scope                = module.azure_app_service_backend_smcr.web_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id
  depends_on           = [module.azure_app_service_backend_smcr]
}
# resource "azurerm_role_assignment" "ci_identity_website_contrib_backend_smcr" {
#   scope = module.azure_app_service_backend_smcr.web_app_id
#   # I ruoli in Azure sono sempre in inglese anche se ho l'interfaccia italiana!
#   role_definition_name = "Website Contributor"
#   principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id
#   depends_on           = [module.azure_app_service_backend_smcr]
# }

resource "azurerm_role_assignment" "smcr_portalefatturazione_storage_contributor" {
  # RISORSE SU CUI APPLICO LA MANAGED IDENTITY
  principal_id = module.azure_app_service_backend_smcr.principal_id
  # Questo dovrebbe essere l'ID della Web APP a cui lego la Managed Identity. ATTENZIONE ora ho messo smcr ma dovrà essere fsmcr o bsmcr in quanto smcr la togliamo!
  scope = var.container_pf #data.azurerm_storage_account.portalefatturazione_storage.id   # Questo definisce dove applico la Managed Identity - Se volessi puntare solo ad un container specifico dovrei usare il suo ID ?

  # VERIFICA IL RUOLO
  role_definition_name = "Storage Blob Data Contributor" # o dobbiamo solo leggere? In quel caso sarebbe "Storage Blob Data Reader"

  # VERIFICA LE DIPENDENZE
  depends_on = [
    module.azure_app_service_backend_smcr, # VERIFICA se è fsmcr oppure bsmcr. Smcr la togliamo!
  ]
}

module "azure_app_service_backend_smcr" {
  source       = "../_modules/app_service"
  node_version = 22

  virtual_network = {
    resource_group_name = module.azure_core_infra.network_resource_group_name
    name                = module.azure_core_infra.common_vnet.name
  }
  resource_group_name = azurerm_resource_group.apps_rg.name

  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.app_backend_service_subnet_cidr.cidr_block

  environment = merge(local.environment, { app_name = "BSMCR", instance_number = local.instance_number })
  # tier                = "l"


  app_settings      = merge(local.common_app_settings, local.backend_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.backend_slot_app_settings)


  health_check_path = "/api/health"
  tags              = local.tags
  depends_on = [
    module.azure_core_infra
  ]
}

# App Service Frontend F-SMCR

# resource "azurerm_role_assignment" "cd_identity_website_contrib_frontend_smcr" {
#   scope                = module.azure_app_service_frontend_smcr.web_app_id
#   role_definition_name = "Website Contributor"
#   principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
#   depends_on           = [module.azure_app_service_frontend_smcr]
# }

# resource "azurerm_role_assignment" "ci_identity_website_contrib_frontend_smcr" {
#   scope = module.azure_app_service_frontend_smcr.web_app_id
#   # I ruoli in Azure sono sempre in inglese anche se ho l'interfaccia italiana!
#   role_definition_name = "Website Contributor"
#   principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id
#   depends_on           = [module.azure_app_service_frontend_smcr]
# }

# module "azure_app_service_frontend_smcr" {
#   source       = "../_modules/app_service"
#   node_version = 22

#   virtual_network = {
#     resource_group_name = module.azure_core_infra.network_resource_group_name
#     name                = module.azure_core_infra.common_vnet.name
#   }
#   resource_group_name = azurerm_resource_group.apps_rg.name

#   subnet_pep_id = module.azure_core_infra.common_pep_snet.id
#   subnet_cidr   = dx_available_subnet_cidr.app_frontend_service_subnet_cidr.cidr_block

#   environment = merge(local.environment, { app_name = "FSMCR", instance_number = local.instance_number })
#   # tier                = "l"


#   app_settings      = merge(local.common_app_settings, local.frontend_app_settings)
#   slot_app_settings = merge(local.common_app_settings, local.frontend_slot_app_settings)


#   health_check_path = "/api/health"
#   tags              = local.tags
#   depends_on = [
#     module.azure_core_infra
#   ]
# }

# App Service FE-SMCR

resource "azurerm_role_assignment" "cd_identity_website_contrib_smcr" {
  scope                = module.azure_fe_app_service_smcr.web_app_id
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_cd_identity.principal_id
  depends_on           = [module.azure_fe_app_service_smcr]
}

resource "azurerm_role_assignment" "ci_identity_website_contrib_smcr" {
  scope = module.azure_fe_app_service_smcr.web_app_id
  # I ruoli in Azure sono sempre in inglese anche se ho l'interfaccia italiana!
  role_definition_name = "Website Contributor"
  principal_id         = data.azurerm_user_assigned_identity.github_ci_identity.principal_id
  depends_on           = [module.azure_fe_app_service_smcr]
}

module "azure_fe_app_service_smcr" {
  source       = "../_modules/app_service"
  node_version = 22

  virtual_network = {
    resource_group_name = module.azure_core_infra.network_resource_group_name
    name                = module.azure_core_infra.common_vnet.name
  }
  resource_group_name = azurerm_resource_group.apps_rg.name #module.azure_core_infra.common_resource_group_name

  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.app_service_subnet_cidr.cidr_block

  environment = merge(local.environment, { app_name = "FE-SMCR", instance_number = local.instance_number })

  app_settings      = merge(local.common_app_settings, local.fe_smcr_app_settings)
  slot_app_settings = merge(local.common_app_settings, local.fe_smcr_slot_app_settings)


  health_check_path = "/api/health"
  tags              = local.tags
  depends_on = [
    module.azure_core_infra
  ]
}

# Postgres
resource "random_password" "password" {
  length  = 16
  special = true
}

resource "azurerm_key_vault_secret" "postgres_username" {
  name         = "postgres-username"
  value        = "adminuser"
  key_vault_id = module.azure_core_infra.common_key_vault.id
  content_type = "text"
  depends_on = [
    azurerm_role_assignment.kv_group_secrets_officer
  ]
}

resource "azurerm_key_vault_secret" "postgres_password" {
  name = "postgres-password"

  value        = random_password.password.result
  key_vault_id = module.azure_core_infra.common_key_vault.id
  content_type = "password"
  depends_on = [
    azurerm_role_assignment.kv_group_secrets_officer
  ]
}

module "postgres_apps" {
  source = "../_modules/postgres"

  environment         = local.environment
  resource_group_name = module.azure_core_infra.common_resource_group_name
  key_vault_id        = module.azure_core_infra.common_key_vault.id

  private_dns_zone_resource_group_name = module.azure_core_infra.network_resource_group_name

  subnet_pep_id     = module.azure_core_infra.common_pep_snet.id
  tags              = local.tags
  postgres_username = azurerm_key_vault_secret.postgres_username.value
  postgres_password = azurerm_key_vault_secret.postgres_password.value

  depends_on = [module.azure_core_infra]
  app_name   = "apps"
}


resource "azurerm_resource_group" "ext_rg" {
  name     = "plsm-p-itn-ext-rg-01"
  location = "Italy North"
}

resource "azurerm_storage_account" "storage_marco_ext_001" {
  name                     = "plsmpitmarcoext001"
  resource_group_name      = azurerm_resource_group.ext_rg.name
  location                 = azurerm_resource_group.ext_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    environment = "production"
  }
}
