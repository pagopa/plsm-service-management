variable "subscription_id" {
  description = "Subscription ID of PLSM" #PROD-PLSM-Platform
  type        = string
}

variable "eventhub_subscription_id" {
  description = "Subscription ID of the target EventHub" #PROD-SelfCare
  type        = string
}