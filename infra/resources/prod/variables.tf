variable "subscription_id" { # Controllare
  description = "Subscription ID of PLSM" #PROD-PLSM-Platform
  type        = string
}

variable "eventhub_subscription_id" {
  description = "Subscription ID of the target EventHub" #PROD-SelfCare
  type        = string
}

variable "container_pf" {
  description = "Container ID of the target PF Container" #PROD-Fatturazione
  type        = string
}

variable "bsmcr_principal_id" {
  description = "B-SMCR Principal ID"
  type        = string
}