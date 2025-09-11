variable "environment" {
  type = object({
    prefix          = string
    env_short       = string
    location        = string
    domain          = string
    instance_number = string
    app_name        = string
  })

  description = "Values which are used to generate resource names and location short names. They are all mandatory except for domain, which should not be used only in the case of a resource used by multiple domains."
}

variable "resource_group_name" {
  type        = string
  description = "Resource group to deploy resources to"
}

variable "tier" {
  type    = string
  default = "l"
}

variable "virtual_network" {
  type = object({
    name                = string
    resource_group_name = string
  })
}

variable "subnet_pep_id" {
  type = string
}

variable "subnet_cidr" {
  type = string
}

variable "health_check_path" {
  type    = string
  default = "/api/health"
}

variable "app_settings" {
  type        = map(any)
  description = "Resources tags"
}

variable "slot_app_settings" {
  type        = map(any)
  description = "Resources tags"
}

variable "tags" {
  type        = map(any)
  description = "Resources tags"
}

variable "node_version" {
  type        = number
  default = 20
  description = "Versione di Node.js da utilizzare per la Function App."
}