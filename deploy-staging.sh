#!/bin/bash
# =============================================================================
# Deploy Frontend to Staging Environment
# =============================================================================
# This script builds and deploys the Next.js frontend to Cloud Run staging
#
# Usage:
#   ./deploy-staging.sh
#
# What it does:
# 1. Builds Docker image with staging backend URL
# 2. Tags with staging-specific tags
# 3. Pushes to Artifact Registry
# 4. Deploys to samu-frontend-staging Cloud Run service
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="samu-ai-474822"
REGION="europe-west1"
SERVICE_NAME="samu-frontend-staging"
REGISTRY_URL="europe-west1-docker.pkg.dev/${PROJECT_ID}/frontend-images"
BACKEND_API_URL="https://samu-ai-triage-staging-262427917999.europe-west1.run.app"

# Generate unique tag with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="staging-${TIMESTAMP}"

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}Deploying Frontend to Staging${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""
echo "Project:     ${PROJECT_ID}"
echo "Service:     ${SERVICE_NAME}"
echo "Image Tag:   ${IMAGE_TAG}"
echo "Backend URL: ${BACKEND_API_URL}"
echo ""

# Step 1: Build Docker image
echo -e "${YELLOW}[1/4] Building Docker image...${NC}"
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL="${BACKEND_API_URL}" \
  -t ${REGISTRY_URL}/frontend:${IMAGE_TAG} \
  -t ${REGISTRY_URL}/frontend:staging-latest \
  .

echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Step 2: Push to Artifact Registry
echo -e "${YELLOW}[2/4] Pushing image to Artifact Registry...${NC}"
docker push ${REGISTRY_URL}/frontend:${IMAGE_TAG}
docker push ${REGISTRY_URL}/frontend:staging-latest

echo -e "${GREEN}✓ Image pushed to registry${NC}"
echo ""

# Step 3: Deploy to Cloud Run
echo -e "${YELLOW}[3/4] Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image=${REGISTRY_URL}/frontend:${IMAGE_TAG} \
  --region=${REGION} \
  --allow-unauthenticated

echo -e "${GREEN}✓ Deployed to Cloud Run${NC}"
echo ""

# Step 4: Get service URL
echo -e "${YELLOW}[4/4] Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format='value(status.url)')

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Service URL: ${GREEN}${SERVICE_URL}${NC}"
echo -e "Image Tag:   ${GREEN}${IMAGE_TAG}${NC}"
echo ""
echo "Test the deployment:"
echo "  curl ${SERVICE_URL}"
echo ""
