#!/bin/bash

# ===========================================
# Docker Swarm Deployment Script
# Deploys to local Swarm for testing
#
# Environment files used:
#   - .env                                    -> API Gateway
#   - apps/applicant-service/.env.development -> Applicant Service
#
# Usage:
#   ./scripts/docker-swarm-deploy.sh
# ===========================================

set -e

echo "🐳 JA-Core - Docker Swarm Deployment"
echo "============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/.."

# Validate environment files exist
echo -e "\n${YELLOW}📋 Checking environment files...${NC}"

if [[ ! -f ".env" ]]; then
  echo -e "${RED}ERROR: .env file not found${NC}"
  echo "Create from example: cp .env.example .env"
  exit 1
fi
echo -e "${GREEN}  ✓ .env${NC}"

if [[ ! -f "apps/applicant-service/.env.development" ]]; then
  echo -e "${RED}ERROR: apps/applicant-service/.env.development not found${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ apps/applicant-service/.env.development${NC}"

# Configuration with defaults
DOCKER_USERNAME="${DOCKER_USERNAME:-your-dockerhub-username}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
TAG="${TAG:-latest}"
STACK_NAME="${STACK_NAME:-ja-core}"

# Validate Docker username
if [[ "$DOCKER_USERNAME" == "your-dockerhub-username" ]]; then
  echo -e "${RED}ERROR: Please set DOCKER_USERNAME${NC}"
  echo "Options:"
  echo "  export DOCKER_USERNAME=yourusername"
  exit 1
fi

echo -e "\n${BLUE}Configuration:${NC}"
echo "  DOCKER_USERNAME: $DOCKER_USERNAME"
echo "  DOCKER_REGISTRY: $DOCKER_REGISTRY"
echo "  TAG: $TAG"
echo "  STACK_NAME: $STACK_NAME"
echo ""

# Step 1: Check if Swarm is initialized
echo -e "\n${YELLOW}📦 Step 1: Checking Docker Swarm...${NC}"
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
  echo "Initializing Docker Swarm..."
  docker swarm init || true
fi
echo -e "${GREEN}  ✓ Docker Swarm is active${NC}"

# Step 2: Build images
echo -e "\n${YELLOW}📦 Step 2: Building Docker images...${NC}"
echo "Building API Gateway..."
docker build -t ${DOCKER_USERNAME}/ja-core-gateway:${TAG} -f apps/api-gateway/Dockerfile .
echo "Building Applicant Service..."
docker build -t ${DOCKER_USERNAME}/ja-core-applicant:${TAG} -f apps/applicant-service/Dockerfile .
echo -e "${GREEN}  ✓ Images built${NC}"

# Step 3: Push to Docker Hub
echo -e "\n${YELLOW}📤 Step 3: Pushing to Docker Hub...${NC}"
echo "Pushing API Gateway..."
docker push ${DOCKER_USERNAME}/ja-core-gateway:${TAG}
echo "Pushing Applicant Service..."
docker push ${DOCKER_USERNAME}/ja-core-applicant:${TAG}
echo -e "${GREEN}  ✓ Images pushed to Docker Hub${NC}"

# Step 4: Deploy stack
echo -e "\n${YELLOW}🚀 Step 4: Deploying stack to Swarm...${NC}"
DOCKER_USERNAME=${DOCKER_USERNAME} \
DOCKER_REGISTRY=${DOCKER_REGISTRY} \
TAG=${TAG} \
docker stack deploy \
  -c docker-compose.swarm.yml \
  ${STACK_NAME}
echo -e "${GREEN}  ✓ Stack deployed${NC}"

# Step 5: Wait and show status
echo -e "\n${YELLOW}⏳ Step 5: Waiting for services to start...${NC}"
sleep 15

echo -e "\n${BLUE}Service Status:${NC}"
docker stack services ${STACK_NAME}

echo -e "\n${BLUE}Service Tasks:${NC}"
docker stack ps ${STACK_NAME}

# Step 6: Test endpoints
echo -e "\n${YELLOW}🔍 Step 6: Testing endpoints...${NC}"
sleep 10

echo "Testing API Gateway health..."
for i in {1..20}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3000/health)
    echo -e "${GREEN}  ✓ API Gateway is healthy${NC}"
    echo "  Response: $HEALTH"
    break
  fi
  echo "  Waiting... ($i/20)"
  sleep 3
done

# Summary
echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN}✓ Docker Swarm Deployment Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo "Stack: ${STACK_NAME}"
echo ""
echo "Environment files loaded:"
echo "  - .env -> API Gateway"
echo "  - apps/applicant-service/.env.development -> Applicant Service"
echo ""
echo "Services:"
echo "  - API Gateway (2 replicas): http://localhost:3000"
echo "  - Applicant Service (2 replicas): internal TCP on port 3002"
echo "  - Redis (1 replica): internal for token revocation"
echo ""
echo "Commands:"
echo "  View services:  docker stack services ${STACK_NAME}"
echo "  View tasks:     docker stack ps ${STACK_NAME}"
echo "  View logs:      docker service logs ${STACK_NAME}_api-gateway"
echo "  Scale:          docker service scale ${STACK_NAME}_applicant-service=3"
echo "  Remove stack:   docker stack rm ${STACK_NAME}"
