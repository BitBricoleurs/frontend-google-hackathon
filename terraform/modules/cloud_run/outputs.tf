# =============================================================================
# Cloud Run Module Outputs
# =============================================================================
# These outputs expose information about the Cloud Run service
# They are used by the root module and displayed to users
# =============================================================================

output "service_name" {
  description = "The name of the Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.name
}

output "service_url" {
  description = "The public URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "service_account_email" {
  description = "Email of the service account used by Cloud Run"
  value       = google_service_account.frontend_sa.email
}
