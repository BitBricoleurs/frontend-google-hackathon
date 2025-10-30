# =============================================================================
# Production Environment Variables
# =============================================================================
# Variable values specific to the PRODUCTION environment
#
# IMPORTANT: Be careful when making changes to production!
# Always run 'terraform plan' before 'terraform apply'
# =============================================================================

# Google Cloud project ID
project_id = "samu-ai-474822"

# Region for deploying resources
region = "europe-west1"

# Backend API URL for production environment
# Update this with your actual production backend URL when available
# Example: "https://samu-ai-triage-production-xxxxx-ew.a.run.app"
# Or your custom domain: "https://api.yourdomain.com"
backend_api_url = "https://samu-ai-triage-production-262427917999.europe-west1.run.app"
