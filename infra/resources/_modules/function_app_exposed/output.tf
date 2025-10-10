output "func_details" {
  value = {
    function_app = module.azurerm_linux_function_app_exposed
  }
}

output "function_app_id" {
  description = "The ID of the Azure Function App created by the inner module."
  value       = module.azurerm_linux_function_app_exposed.function_app.function_app.id
}
