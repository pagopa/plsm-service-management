output "func_details" {
  value = {
    function_app = module.azurerm_linux_function_app
  }
}

output "function_app_id" {
  description = "The ID of the Azure Function App created by the inner module."
  value = module.azurerm_linux_function_app.function_app.function_app.id
}

output "function_app_principal_id" {
  description = "The principal ID of the Azure Function App created by the inner module."
  value = module.azurerm_linux_function_app.function_app.function_app.principal_id
}