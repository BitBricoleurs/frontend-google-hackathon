# =============================================================================
# SAMU AI Frontend - Terraform Infrastructure
# =============================================================================
# This file configures the root Terraform module for deploying the Next.js
# frontend application to Google Cloud Run across multiple environments.
#
# Architecture:
# - Google Cloud Run for serverless container deployment
# - Artifact Registry for container image storage
# - Multi-environment setup (dev, staging, production)
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform Configuration
# -----------------------------------------------------------------------------
# Specifies required Terraform version and provider versions
terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# Google Cloud Provider Configuration
# -----------------------------------------------------------------------------
# Configures the Google Cloud provider with project and region settings
provider "google" {
  project = var.project_id
  region  = var.region
}

# -----------------------------------------------------------------------------
# Cloud Run Module
# -----------------------------------------------------------------------------
# Deploys the frontend Next.js application to Cloud Run
# This module handles:
# - Cloud Run service creation and configuration
# - Service account setup and IAM permissions
# - Auto-scaling and resource limits
# - Public access configuration
module "cloud_run" {
  source = "./modules/cloud_run"

  # Pass variables to the module
  project_id  = var.project_id
  region      = var.region
  environment = var.environment

  # Backend API URL (will be configured per environment)
  # This gets injected as NEXT_PUBLIC_API_URL in the container
  backend_api_url = var.backend_api_url
}
