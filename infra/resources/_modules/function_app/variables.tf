variable "environment" {
  type = object({
    prefix          = string
    env_short       = string
    location        = string
    domain          = optional(string)
    instance_number = string
    app_name        = string
  })

  description = "Values which are used to generate resource names and location short names. They are all mandatory except for domain, which should not be used only in the case of a resource used by multiple domains."
}

variable "resource_group_name" {
  type        = string
  description = "Il nome del Resource Group dove creare la funzione."
}

variable "tags" {
  type        = map(string)
  description = "I tag da applicare a tutte le risorse."
}

variable "app_settings" {
  type        = map(string)
  description = "Le impostazioni dell'applicazione per la Function App."
  default     = {}
}

variable "virtual_network" {
  type = object({
    name                = string
    resource_group_name = string
  })
  description = "L'oggetto della VNet, contenente nome e ID."
}

variable "subnet_pep_id" {
  type        = string
  description = "L'ID della subnet per i Private Endpoint."
}

variable "subnet_cidr" {
  type        = string
  description = "L'ID della subnet per i Private Endpoint."
}

variable "health_check_path" {
  type        = string
  description = "Il path per l'health check della funzione."
  default     = null
}

variable "node_version" {
  type        = number
  default = 20
  description = "Versione di Node.js da utilizzare per la Function App."
}
