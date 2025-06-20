output "ci_identity" {
  value       = module.federated_identity.federated_ci_identity
  description = "Identità per CI infrastruttura"
  sensitive   = false
}

output "cd_identity" {
  value       = module.federated_identity.federated_cd_identity
  description = "Identità per CI infrastruttura"
  sensitive   = false
}
