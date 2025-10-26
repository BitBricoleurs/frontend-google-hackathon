#!/bin/bash
# =============================================================================
# Deploy Frontend to Production Environment
# =============================================================================
# This script builds and deploys the Next.js frontend to Cloud Run production
#
# Usage:
#   ./deploy-production.sh [VERSION]
#
# Examples:
#   ./deploy-production.sh v1.0.0
#   ./deploy-production.sh v1.2.3
#
# What it does:
# 1. Validates version number
# 2. Builds Docker image with production backend URL
# 3. Tags with production-specific tags
# 4. Pushes to Artifact Registry
# 5. Deploys to samu-frontend-production Cloud Run service
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
SERVICE_NAME="samu-frontend-production"
REGISTRY_URL="europe-west1-docker.pkg.dev/${PROJECT_ID}/frontend-images"
BACKEND_API_URL="https://samu-ai-triage-production-262427917999.europe-west1.run.app"

# Check if version is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Version number required${NC}"
  echo ""
  echo "Usage: $0 [VERSION]"
  echo ""
  echo "Examples:"
  echo "  $0 v1.0.0"
  echo "  $0 v1.2.3"
  echo ""
  exit 1
fi

VERSION=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Validate version format (vX.Y.Z)
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version format${NC}"
  echo "Version must be in format: vX.Y.Z (e.g., v1.0.0)"
  exit 1
fi

echo -e "${RED}======================================${NC}"
echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT${NC}"
echo -e "${RED}======================================${NC}"
echo ""
echo "Project:     ${PROJECT_ID}"
echo "Service:     ${SERVICE_NAME}"
echo "Version:     ${VERSION}"
echo "Backend URL: ${BACKEND_API_URL}"
echo ""
echo -e "${YELLOW}This will deploy to PRODUCTION!${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Deployment cancelled."
  exit 0
fi

# Step 1: Build Docker image
echo -e "${YELLOW}[1/4] Building Docker image...${NC}"
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL="${BACKEND_API_URL}" \
  -t ${REGISTRY_URL}/frontend:${VERSION} \
  -t ${REGISTRY_URL}/frontend:production-latest \
  -t ${REGISTRY_URL}/frontend:production-${TIMESTAMP} \
  .

echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Step 2: Push to Artifact Registry
echo -e "${YELLOW}[2/4] Pushing image to Artifact Registry...${NC}"
docker push ${REGISTRY_URL}/frontend:${VERSION}
docker push ${REGISTRY_URL}/frontend:production-latest
docker push ${REGISTRY_URL}/frontend:production-${TIMESTAMP}

echo -e "${GREEN}✓ Image pushed to registry${NC}"
echo ""

# Step 3: Deploy to Cloud Run
echo -e "${YELLOW}[3/4] Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image=${REGISTRY_URL}/frontend:${VERSION} \
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
echo -e "${GREEN}Production Deployment Successful!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Service URL: ${GREEN}${SERVICE_URL}${NC}"
echo -e "Version:     ${GREEN}${VERSION}${NC}"
echo ""
echo "Image tags created:"
echo "  - ${VERSION}"
echo "  - production-latest"
echo "  - production-${TIMESTAMP}"
echo ""
echo "Test the deployment:"
echo "  curl ${SERVICE_URL}"
echo ""
