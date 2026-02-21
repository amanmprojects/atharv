output "cloud_run_url" {
  value = google_cloud_run_service.doc_editor.status[0].url
}

output "documents_bucket" {
  value = google_storage_bucket.documents.name
}

output "thumbnails_bucket" {
  value = google_storage_bucket.thumbnails.name
}

output "firestore_database" {
  value = google_firestore_database.main.name
}

output "doc_editor_service_account" {
  value = google_service_account.doc_editor.email
}

output "ai_processor_service_account" {
  value = google_service_account.ai_processor.email
}

output "pubsub_topics" {
  value = {
    ai_processing = google_pubsub_topic.ai_processing.name
    document_events = google_pubsub_topic.document_events.name
    audit_log = google_pubsub_topic.audit_log.name
  }
}
