output "func_details" {
  value = {
    function_app = module.azurerm_linux_function_app
  }
}

output "function_app_id" {
  description = "The ID of the Azure Function App created by the inner module."
  # Prendiamo l'ID dall'output del modulo "azurerm_linux_function_app"
  # che hai dichiarato nel main.tf di questo modulo.
  value = module.azurerm_linux_function_app.function_app.function_app.id
}
# OUTPUT del modulo: 
# https://github.com/pagopa-dx/terraform-azurerm-azure-function-app/blob/main/outputs.tf
# module.onboarding_function
# └── func_details (Questo è un oggetto)
#     └── function_app (Questo è il vero oggetto della Function App)
#         ├── id  <-- L'attributo che ti serve è qui dentro!
#         ├── name
#         └── ...altri attributi
