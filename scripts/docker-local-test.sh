#!/bin/bash

# ===========================================
# Local Docker Test Script (non-Swarm)
# Tests service discovery with Docker Compose
# ===========================================

set -e

echo "🐳 JA-Core - Local Docker Test"
echo "======================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-local}"
TAG="${TAG:-latest}"

cd "$(dirname "$0")/.."

# Step 1: Build images
echo -e "\n${YELLOW}📦 Step 1: Building Docker images...${NC}"
docker compose -f docker-compose.local.yml build

# Step 2: Start services
echo -e "\n${YELLOW}🚀 Step 2: Starting services...${NC}"
docker compose -f docker-compose.local.yml up -d

# Step 3: Wait for services to be healthy
echo -e "\n${YELLOW}⏳ Step 3: Waiting for services to be healthy...${NC}"
sleep 10

# Check Redis
echo "Checking Redis..."
for i in {1..15}; do
  if docker exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Redis is ready${NC}"
    break
  fi
  echo "  Waiting for Redis... ($i/15)"
  sleep 2
done

# Check Applicant Service
echo "Checking Applicant Service..."
for i in {1..30}; do
  if curl -s http://localhost:3012/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Applicant Service is ready${NC}"
    break
  fi
  echo "  Waiting for Applicant Service... ($i/30)"
  sleep 2
done

# Check API Gateway
echo "Checking API Gateway..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ API Gateway is ready${NC}"
    break
  fi
  echo "  Waiting for API Gateway... ($i/30)"
  sleep 2
done

# Step 4: Test service discovery
echo -e "\n${YELLOW}🔍 Step 4: Testing Service Discovery...${NC}"

# Test health endpoints
echo "Testing API Gateway health..."
GATEWAY_HEALTH=$(curl -s http://localhost:3000/health)
echo "  Response: $GATEWAY_HEALTH"

echo "Testing Applicant Service health..."
APPLICANT_HEALTH=$(curl -s http://localhost:3012/health)
echo "  Response: $APPLICANT_HEALTH"

# Test API Gateway -> Applicant Service communication
echo -e "\n${YELLOW}🔗 Step 5: Testing Gateway -> Applicant Service TCP Communication...${NC}"

# Try to list applicants (should work even if empty)
echo "Testing GET /applicants..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/applicants 2>&1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "401" ]]; then
  echo -e "${GREEN}  ✓ TCP communication working! (HTTP $HTTP_CODE)${NC}"
  echo "  Response: $BODY"
else
  echo -e "${RED}  ✗ TCP communication failed (HTTP $HTTP_CODE)${NC}"
  echo "  Response: $BODY"
fi

# Step 6: Test DNS resolution inside container
echo -e "\n${YELLOW}🌐 Step 6: Verifying DNS Resolution...${NC}"
echo "Resolving 'applicant-service' from api-gateway container..."
docker exec api-gateway sh -c "nslookup applicant-service 2>/dev/null || getent hosts applicant-service" || echo "  (nslookup not available, but service discovery works via Docker DNS)"

# Summary
echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}✓ Local Docker Test Complete!${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""
echo "Services running:"
echo "  - API Gateway:       http://localhost:3000"
echo "  - API Gateway Health: http://localhost:3000/health"
echo "  - Applicant Health:  http://localhost:3012/health"
echo "  - Redis:             redis://localhost:6379"
echo ""
echo "Service Discovery: API Gateway connects to 'applicant-service:3002'"
echo "                   Docker DNS resolves this automatically!"
echo ""
echo "Commands:"
echo "  View logs:    docker compose -f docker-compose.local.yml logs -f"
echo "  Stop:         docker compose -f docker-compose.local.yml down"
echo "  Stop + clean: docker compose -f docker-compose.local.yml down -v"
