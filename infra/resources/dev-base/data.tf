data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_user_assigned_identity" "github_ci_identity_infra" {
  resource_group_name = "plsm-d-itn-sm-rg-01"
  name                = "plsm-d-itn-sm-infra-github-ci-id-01"
}

data "azurerm_user_assigned_identity" "github_cd_identity_infra" {
  resource_group_name = "plsm-d-itn-sm-rg-01"
  name                = "plsm-d-itn-sm-infra-github-cd-id-01"
}
