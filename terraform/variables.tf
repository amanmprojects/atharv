variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "app_name" {
  type    = string
  default = "docdraft"
}

variable "domain" {
  type    = string
  default = ""
}
