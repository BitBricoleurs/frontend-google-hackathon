# =============================================================================
# Cloud Run Module - Frontend Deployment
# =============================================================================
# This module creates and configures a Google Cloud Run service for the
# Next.js frontend application.
#
# Resources created:
# - Cloud Run v2 service (serverless container platform)
# - Service Account (identity for the Cloud Run service)
# - IAM bindings (permissions for public access)
#
# The service is configured with minimal resources for cost optimization
# while maintaining good performance.
# =============================================================================

# -----------------------------------------------------------------------------
# Cloud Run Service
# -----------------------------------------------------------------------------
# Creates the main Cloud Run service that hosts the Next.js container

resource "google_cloud_run_v2_service" "frontend" {
  # Service name format: samu-frontend-{environment}
  # Examples: samu-frontend-dev, samu-frontend-staging, samu-frontend-production
  name     = "samu-frontend-${var.environment}"
  location = var.region
  project  = var.project_id

  # Service template defines how containers run
  template {
    # -------------------------------------------------------------------------
    # Scaling Configuration
    # -------------------------------------------------------------------------
    # Controls how many instances (containers) run simultaneously
    scaling {
      # Minimum instances:
      # - dev/staging: 0 (scale to zero when not in use to save costs)
      # - production: 1 (always keep one instance warm for better response times)
      min_instance_count = var.environment == "production" ? 1 : 0

      # Maximum instances:
      # - dev: 2 (limit costs during development)
      # - staging: 3 (moderate load testing)
      # - production: 10 (handle production traffic spikes)
      max_instance_count = var.environment == "production" ? 10 : (var.environment == "staging" ? 3 : 2)
    }

    # -------------------------------------------------------------------------
    # Service Account
    # -------------------------------------------------------------------------
    # The identity used by the container to access other GCP services
    service_account = google_service_account.frontend_sa.email

    # -------------------------------------------------------------------------
    # Request Timeout
    # -------------------------------------------------------------------------
    # Maximum time a request can take before timing out (300 seconds = 5 minutes)
    # Next.js pages should respond much faster, but this allows for slow API calls
    timeout = "300s"

    # -------------------------------------------------------------------------
    # Container Configuration
    # -------------------------------------------------------------------------
    containers {
      # Initial placeholder image (will be replaced by your actual image)
      # Update this via CI/CD or manually with:
      # gcloud run deploy samu-frontend-{env} --image=europe-west1-docker.pkg.dev/samu-ai-474822/frontend-images/frontend:tag
      image = "gcr.io/cloudrun/hello"

      # Port configuration
      ports {
        # Cloud Run default port - Next.js will listen on this via process.env.PORT
        container_port = 8080
        name           = "http1"
      }

      # -----------------------------------------------------------------------
      # Resource Limits
      # -----------------------------------------------------------------------
      # CPU and memory allocated to each container instance
      resources {
        limits = {
          # CPU allocation (in vCPUs):
          # - dev/staging: 1 vCPU (minimal, good for low traffic)
          # - production: 2 vCPUs (better performance, handle concurrent users)
          cpu = var.environment == "production" ? "2" : "1"

          # Memory allocation:
          # - dev/staging: 512 MB (minimal for Next.js)
          # - production: 1 GB (comfortable for production loads)
          memory = var.environment == "production" ? "1Gi" : "512Mi"
        }

        # CPU idle: true means CPU is only allocated when processing requests
        # This reduces costs when there's no traffic
        cpu_idle = true

        # Startup CPU boost: gives extra CPU during container startup
        # Helps Next.js start faster
        startup_cpu_boost = true
      }

      # -----------------------------------------------------------------------
      # Environment Variables
      # -----------------------------------------------------------------------
      # Configuration passed to the Next.js application

      # Node.js environment
      env {
        name  = "NODE_ENV"
        value = var.environment == "production" ? "production" : "development"
      }

      # Backend API URL (for frontend to call backend services)
      # This becomes available as process.env.NEXT_PUBLIC_API_URL in your Next.js app
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = var.backend_api_url != "" ? var.backend_api_url : "https://placeholder-api.example.com"
      }

      # NOTE: PORT environment variable is automatically set by Cloud Run
      # Cloud Run sets PORT=8080 by default, but the service will route
      # traffic to the container_port defined above (3000)

      # -----------------------------------------------------------------------
      # Health Checks
      # -----------------------------------------------------------------------
      # Cloud Run uses these to determine if the container is healthy

      # Startup probe: checks if the app has started successfully
      # Cloud Run waits for this before sending traffic
      startup_probe {
        http_get {
          path = "/"  # Next.js root page
          port = 8080
        }
        initial_delay_seconds = 0      # Start checking immediately
        timeout_seconds       = 3      # Wait 3 seconds for response (must be < period_seconds)
        period_seconds        = 5      # Check every 5 seconds
        failure_threshold     = 20     # Restart after 20 failed checks (100s total)
      }

      # Liveness probe: checks if the app is still running
      # If this fails, Cloud Run restarts the container
      liveness_probe {
        http_get {
          path = "/"
          port = 8080
        }
        initial_delay_seconds = 30     # Wait 30 seconds after startup
        timeout_seconds       = 3      # Wait 3 seconds for response
        period_seconds        = 30     # Check every 30 seconds
        failure_threshold     = 3      # Restart after 3 failed checks
      }
    }

    # -------------------------------------------------------------------------
    # Concurrency
    # -------------------------------------------------------------------------
    # Maximum number of concurrent requests per container instance
    # 80 is a good default for Next.js applications
    max_instance_request_concurrency = 80

    # -------------------------------------------------------------------------
    # Labels
    # -------------------------------------------------------------------------
    # Metadata for organizing and filtering resources
    labels = {
      environment = var.environment
      managed_by  = "terraform"
      app         = "samu-frontend"
    }
  }

  # ---------------------------------------------------------------------------
  # Traffic Routing
  # ---------------------------------------------------------------------------
  # Send 100% of traffic to the latest revision (newest deployed version)
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  # ---------------------------------------------------------------------------
  # Lifecycle Configuration
  # ---------------------------------------------------------------------------
  # Prevent Terraform from reverting container image changes made by CI/CD
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,  # Image is updated by CI/CD pipeline
    ]
  }
}

# -----------------------------------------------------------------------------
# Service Account for Cloud Run
# -----------------------------------------------------------------------------
# Creates a dedicated service account that the Cloud Run service uses
# This follows the principle of least privilege (only grant necessary permissions)

resource "google_service_account" "frontend_sa" {
  # Service account ID format: samu-frontend-{environment}
  account_id   = "samu-frontend-${var.environment}"
  display_name = "SAMU Frontend ${title(var.environment)}"
  project      = var.project_id

  # Example emails:
  # - samu-frontend-dev@samu-ai-474822.iam.gserviceaccount.com
  # - samu-frontend-production@samu-ai-474822.iam.gserviceaccount.com
}

# -----------------------------------------------------------------------------
# IAM: Public Access
# -----------------------------------------------------------------------------
# Allows anyone on the internet to invoke (access) the Cloud Run service
# Remove this if you want to require authentication

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name

  # Role: Cloud Run Invoker (permission to call the service)
  role = "roles/run.invoker"

  # Member: allUsers (anyone, including unauthenticated users)
  # Change to "allAuthenticatedUsers" to require Google authentication
  member = "allUsers"
}

# -----------------------------------------------------------------------------
# Optional: IAM for Backend API Access
# -----------------------------------------------------------------------------
# Uncomment if your frontend service account needs to call authenticated backend APIs

# resource "google_project_iam_member" "backend_invoker" {
#   project = var.project_id
#   role    = "roles/run.invoker"
#   member  = "serviceAccount:${google_service_account.frontend_sa.email}"
# }
