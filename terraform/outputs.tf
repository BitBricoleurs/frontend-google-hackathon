# =============================================================================
# Output Values
# =============================================================================
# These outputs expose important information about the deployed infrastructure
# that you'll need for:
# - Accessing your deployed application
# - Configuring CI/CD pipelines
# - Debugging and monitoring
# - Setting up custom domains
#
# View outputs after deployment with: terraform output
# =============================================================================

# -----------------------------------------------------------------------------
# Cloud Run Service Information
# -----------------------------------------------------------------------------

output "cloud_run_url" {
  description = "The public URL of the deployed frontend application"
  value       = module.cloud_run.service_url

  # This is the URL where your Next.js app is accessible
  # Format: https://samu-frontend-{environment}-xxxxxxxxx-ew.a.run.app
}

output "service_name" {
  description = "Cloud Run service name (used for CI/CD deployments)"
  value       = module.cloud_run.service_name

  # Use this name when deploying new container images via gcloud or CI/CD
  # Example: gcloud run deploy [service_name] --image=[image_url]
}

output "service_account_email" {
  description = "Service account email used by Cloud Run (for IAM permissions)"
  value       = module.cloud_run.service_account_email

  # Grant additional permissions to this service account if needed
  # Example: access to Cloud Storage, Cloud SQL, etc.
}

# -----------------------------------------------------------------------------
# Deployment Information
# -----------------------------------------------------------------------------

output "project_id" {
  description = "Google Cloud project ID where resources are deployed"
  value       = var.project_id
}

output "region" {
  description = "Google Cloud region where resources are deployed"
  value       = var.region
}

output "environment" {
  description = "Current deployment environment"
  value       = var.environment
}

# -----------------------------------------------------------------------------
# Container Registry Information
# -----------------------------------------------------------------------------

output "artifact_registry_url" {
  description = "Full URL to push container images"
  value       = "europe-west1-docker.pkg.dev/${var.project_id}/frontend-images"

  # Use this URL when building and pushing Docker images:
  # docker build -t [this_url]/frontend:tag .
  # docker push [this_url]/frontend:tag
}
