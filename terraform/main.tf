terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "gcs" {
    bucket = "docdraft-terraform-state"
    prefix = "terraform/state"
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "docdraft"
}

variable "domain" {
  description = "Custom domain for the application"
  type        = string
  default     = ""
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

module "project_services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "~> 14.0"

  project_id = var.project_id

  activate_apis = [
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "pubsub.googleapis.com",
    "aiplatform.googleapis.com",
    "run.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "identitytoolkit.googleapis.com",
    "firebaserules.googleapis.com",
    "firebase.googleapis.com",
  ]
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
  project = var.project_id

  disable_on_destroy = false
}

resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}

resource "google_storage_bucket" "documents" {
  name          = "${var.project_id}-documents"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket" "thumbnails" {
  name          = "${var.project_id}-thumbnails"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true
}

resource "google_secret_manager_secret" "doc_encryption_key" {
  secret_id = "doc-encryption-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "doc_encryption_key_version" {
  secret      = google_secret_manager_secret.doc_encryption_key.id
  secret_data = random_id.suffix.hex
}

resource "google_pubsub_topic" "ai_processing" {
  name = "ai-document-processing"
}

resource "google_pubsub_topic" "document_events" {
  name = "document-events"
}

resource "google_pubsub_topic" "audit_log" {
  name = "audit-log"
}

resource "google_pubsub_subscription" "ai_processing_sub" {
  name  = "ai-processing-subscription"
  topic = google_pubsub_topic.ai_processing.name

  ack_deadline_seconds = 300

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_service_account" "doc_editor" {
  account_id   = "doc-editor-sa"
  display_name = "Document Editor Service Account"
}

resource "google_project_iam_member" "doc_editor_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.doc_editor.email}"
}

resource "google_project_iam_member" "doc_editor_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.doc_editor.email}"
}

resource "google_project_iam_member" "doc_editor_secret" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.doc_editor.email}"
}

resource "google_project_iam_member" "doc_editor_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.doc_editor.email}"
}

resource "google_project_iam_member" "doc_editor_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.doc_editor.email}"
}

resource "google_service_account" "ai_processor" {
  account_id   = "ai-processor-sa"
  display_name = "AI Processor Service Account"
}

resource "google_project_iam_member" "ai_processor_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.ai_processor.email}"
}

resource "google_project_iam_member" "ai_processor_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.ai_processor.email}"
}

resource "google_project_iam_member" "ai_processor_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.ai_processor.email}"
}

resource "google_project_iam_member" "ai_processor_vertex" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ai_processor.email}"
}

resource "google_cloud_run_service" "doc_editor" {
  name     = "${var.app_name}-editor"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.doc_editor.email
      containers {
        image = "gcr.io/${var.project_id}/${var.app_name}:latest"
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
        env {
          name  = "GOOGLE_CLOUD_REGION"
          value = var.region
        }
        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "100"
        "autoscaling.knative.dev/minScale" = "1"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_service.doc_editor.location
  service  = google_cloud_run_service.doc_editor.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "cloud_run_url" {
  value = google_cloud_run_service.doc_editor.status[0].url
}

output "documents_bucket" {
  value = google_storage_bucket.documents.name
}

output "firestore_database" {
  value = google_firestore_database.main.name
}

output "doc_editor_service_account" {
  value = google_service_account.doc_editor.email
}
