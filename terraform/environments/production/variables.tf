# =============================================================================
# Production Environment Variables Declaration
# =============================================================================

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "europe-west1"
}

variable "backend_api_url" {
  description = "Backend API URL for the frontend"
  type        = string
  default     = ""
}
