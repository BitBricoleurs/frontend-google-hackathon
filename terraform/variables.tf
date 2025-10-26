# =============================================================================
# Input Variables
# =============================================================================
# These variables allow you to customize the infrastructure deployment
# without modifying the core Terraform code.
#
# Usage:
# - Set values in terraform.tfvars files in each environment directory
# - Or pass via command line: terraform apply -var="project_id=my-project"
# =============================================================================

# -----------------------------------------------------------------------------
# Google Cloud Project Configuration
# -----------------------------------------------------------------------------

variable "project_id" {
  description = "Google Cloud Project ID where resources will be created"
  type        = string

  # Example: "samu-ai-474822"
}

variable "region" {
  description = "Google Cloud region for deploying resources"
  type        = string
  default     = "europe-west1"

  # Available regions: europe-west1, us-central1, asia-northeast1, etc.
  # Choose a region close to your users for lower latency
}

# -----------------------------------------------------------------------------
# Environment Configuration
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Deployment environment (dev, staging, or production)"
  type        = string

  # Validation ensures only valid environment names are used
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production"
  }
}

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------

variable "backend_api_url" {
  description = "Backend API URL that the frontend will connect to (NEXT_PUBLIC_API_URL)"
  type        = string
  default     = ""

  # Examples:
  # - Dev: "https://samu-ai-triage-dev-xxxxx.run.app"
  # - Staging: "https://samu-ai-triage-staging-xxxxx.run.app"
  # - Production: "https://api.yourdomain.com"
  #
  # Leave empty if not yet configured - can be updated later
}
