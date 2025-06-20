data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_user_assigned_identity" "identity_prod_ci" {
  name                = "${local.project}-functions-admin-github-ci-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_prod_cd" {
  name                = "${local.project}-functions-admin-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}