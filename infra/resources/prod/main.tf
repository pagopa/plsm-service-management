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
  features {}
}

module "azure_core_infra" {
  source  = "pagopa-dx/azure-core-infra/azurerm"
  version = "2.1.1"

  environment = merge(local.environment, {
    app_name        = "smcr",
    instance_number = "01"
  })

  nat_enabled = false

  # virtual_network_cidr = "10.0.0.0/16"

  test_enabled = false

  tags = local.tags
}

resource "dx_available_subnet_cidr" "next_cidr" {
  virtual_network_id = module.azure_core_infra.common_vnet.id
  prefix_length      = 24 # For a /24 subnet
  depends_on         = [module.azure_core_infra]
}

module "certifica_function" {
  source = "../_modules/function_app"

  environment = merge(local.environment, {
    app_name        = "cert",
    instance_number = "01"
  })
  resource_group_name = module.azure_core_infra.common_resource_group_name
  tags                = local.tags

  virtual_network = {
    name                = module.azure_core_infra.common_vnet.name
    resource_group_name = module.azure_core_infra.common_resource_group_name
  }
  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.next_cidr.cidr_block

  health_check_path = "/api/v1/certificate-function/health"
  app_settings = {    
    DB_HOST                      = "${data.azurerm_key_vault_secret.db_host.value}"
    DB_NAME                      = "${data.azurerm_key_vault_secret.db_name.value}"
    DB_USER                      = "${data.azurerm_key_vault_secret.db_user.value}"
    DB_PASSWORD                  = "${data.azurerm_key_vault_secret.db_password.value}"
    DB_SSL                       = true

  }

  depends_on = [module.azure_core_infra]
}

# App Service
resource "azurerm_resource_group" "apps_rg" {
  name     = "sm-p-itn-apps-rg-01"
  location = "Italy North"
}

module "azure_app_service" {
  source = "../_modules/app_service"

  virtual_network = {
    resource_group_name = module.azure_core_infra.network_resource_group_name
    name                = module.azure_core_infra.common_vnet.name
  }
  resource_group_name = azurerm_resource_group.apps_rg.name #module.azure_core_infra.common_resource_group_name

  subnet_pep_id = module.azure_core_infra.common_pep_snet.id
  subnet_cidr   = dx_available_subnet_cidr.next_cidr.cidr_block # "10.0.8.0/23" #

  environment = merge(local.environment, { app_name = "SMCR", instance_number = local.instance_number })
  # tier                = "l"


  app_settings      = local.common_app_settings
  slot_app_settings = local.common_app_settings


  health_check_path = "/health"
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
}

resource "azurerm_key_vault_secret" "postgres_password" {
  name = "postgres-password"

  value        = random_password.password.result
  key_vault_id = module.azure_core_infra.common_key_vault.id
  content_type = "password"
}

module "postgres" {
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
}
