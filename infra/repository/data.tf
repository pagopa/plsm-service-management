data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_user_assigned_identity" "infra_identity_prod_ci" {
  name                = "${local.project}-plsm-identity-infra-github-ci-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "infra_identity_prod_cd" {
  name                = "${local.project}-plsm-identity-infra-github-cd-id-01"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "app_identity_prod_ci" {
  name                = "${local.project}-plsm-identity-app-github-ci-id-02"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "app_identity_prod_cd" {
  name                = "${local.project}-plsm-identity-app-github-cd-id-02"
  resource_group_name = local.identity_resource_group_name
}
