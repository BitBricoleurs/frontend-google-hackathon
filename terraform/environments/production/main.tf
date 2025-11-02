# =============================================================================
# Production Environment Configuration
# =============================================================================
# This file configures the Terraform deployment for the PRODUCTION environment
#
# Characteristics of PRODUCTION environment:
# - Higher resources (optimized for performance)
# - Always keeps 1 instance warm (min_instance_count = 1)
# - Handles real user traffic
# - Higher scaling limits for traffic spikes
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform Backend Configuration (Optional)
# -----------------------------------------------------------------------------
# STRONGLY RECOMMENDED for production to enable:
# - State locking (prevents concurrent modifications)
# - Team collaboration
# - State backup and versioning
#
# terraform {
#   backend "gcs" {
#     bucket = "samu-ai-terraform-state"
#     prefix = "frontend/production"
#   }
# }

# -----------------------------------------------------------------------------
# Root Module
# -----------------------------------------------------------------------------
module "frontend_production" {
  source = "../../"

  project_id      = var.project_id
  region          = var.region
  environment     = "production"
  backend_api_url = var.backend_api_url
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "cloud_run_url" {
  description = "Public URL of the production frontend"
  value       = module.frontend_production.cloud_run_url
}

output "service_name" {
  description = "Cloud Run service name"
  value       = module.frontend_production.service_name
}

output "artifact_registry_url" {
  description = "URL to push Docker images"
  value       = module.frontend_production.artifact_registry_url
}
