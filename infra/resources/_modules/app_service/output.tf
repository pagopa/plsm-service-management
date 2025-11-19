output "web_app_id" {
  description = "The ID of the Azure Web App created by the inner module."
  value       = module.azure_app_service.app_service.app_service.id
}

output "principal_id" {
  description = "The Principal ID of the Azure Web App created by the inner module."
  value       = module.azure_app_service.app_service.app_service.principal_id
}
