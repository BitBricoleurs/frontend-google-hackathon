# =============================================================================
# Cloud Run Module Variables
# =============================================================================
# Input variables for the cloud_run module
# These are passed from the root module (main.tf)
# =============================================================================

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region for Cloud Run deployment"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
}

variable "backend_api_url" {
  description = "Backend API URL for the frontend to connect to"
  type        = string
  default     = ""
}
