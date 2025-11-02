# =============================================================================
# Staging Environment Configuration
# =============================================================================
# This file configures the Terraform deployment for the STAGING environment
#
# Characteristics of STAGING environment:
# - Moderate resources (balanced cost/performance)
# - Scale to zero when not in use
# - Used for pre-production testing and QA
# - Mimics production but with lower limits
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform Backend Configuration (Optional)
# -----------------------------------------------------------------------------
# Uncomment to store Terraform state in Google Cloud Storage
#
# terraform {
#   backend "gcs" {
#     bucket = "samu-ai-terraform-state"
#     prefix = "frontend/staging"
#   }
# }

# -----------------------------------------------------------------------------
# Root Module
# -----------------------------------------------------------------------------
module "frontend_staging" {
  source = "../../"

  project_id      = var.project_id
  region          = var.region
  environment     = "staging"
  backend_api_url = var.backend_api_url
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "cloud_run_url" {
  description = "Public URL of the staging frontend"
  value       = module.frontend_staging.cloud_run_url
}

output "service_name" {
  description = "Cloud Run service name"
  value       = module.frontend_staging.service_name
}

output "artifact_registry_url" {
  description = "URL to push Docker images"
  value       = module.frontend_staging.artifact_registry_url
}
