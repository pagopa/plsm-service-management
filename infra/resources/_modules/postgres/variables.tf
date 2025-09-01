variable "resource_group_name" {
  type        = string
  description = "Resource group to deploy resources to"
}

variable "tags" {
  type        = map(any)
  description = "Resources tags"
}


variable "environment" {
  type = object({
    prefix    = string
    env_short = string
    location  = string
    domain    = string
  })

  description = "Values which are used to generate resource names and location short names. They are all mandatory except for domain, which should not be used only in the case of a resource used by multiple domains."
}

variable "subnet_pep_id" {
  type = string
}

variable "private_dns_zone_resource_group_name" {
  type = string
}

variable "key_vault_id" {
  type        = string
  description = "Id of the team domain key vault"
}

variable "postgres_username" {
  type        = string
  description = "Postgres username"
}

variable "postgres_password" {
  type        = string
  description = "Postgres password"
}