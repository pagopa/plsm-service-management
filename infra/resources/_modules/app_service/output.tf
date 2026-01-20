output "web_app_id" {
  description = "The ID of the Azure Web App created by the inner module."
  value       = module.azure_app_service.app_service.app_service.id
}

output "principal_id" {
  description = "The Principal ID of the Azure Web App created by the inner module."
  value       = module.azure_app_service.app_service.app_service.principal_id
}

output "subnet_id" {

  description = "The ID of the subnet used by the Azure Web App for VNet integration."

  value       = module.azure_app_service.subnet.id

}