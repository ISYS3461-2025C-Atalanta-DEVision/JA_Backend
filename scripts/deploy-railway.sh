#!/usr/bin/env bash

# =============================================================================
# Railway Deployment Script for JA-Core Microservices
# =============================================================================
# Usage:
#   ./scripts/deploy-railway.sh <service>     # Deploy single service
#   ./scripts/deploy-railway.sh --all         # Deploy all services
#   ./scripts/deploy-railway.sh --list        # List available services
# =============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RAILWAY_TOML="$PROJECT_ROOT/railway.toml"

# =============================================================================
# Service Mapping: folder-name → railway-service-name
# Update this function when adding new services
# =============================================================================
get_railway_service() {
  local folder="$1"
  case "$folder" in
    api-gateway)            echo "api-gateway" ;;
    applicant-service)      echo "applicant-service" ;;
    admin-service)          echo "admin-service" ;;
    job-skill-service)      echo "job-skill-service" ;;
    notification-service)   echo "notification-service" ;;
    work-history-service)   echo "work-history-service" ;;
    job-application-service) echo "job-application-service" ;;
    education-service)      echo "education-service" ;;
    *)                      echo "" ;;
  esac
}

# All services in deployment order (api-gateway last)
ALL_SERVICES="applicant-service admin-service job-skill-service notification-service work-history-service job-application-service education-service api-gateway"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}============================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}→ $1${NC}"
}

list_services() {
  print_header "Available Services"
  echo "Folder Name                → Railway Service Name"
  echo "---------------------------------------------------"
  echo "api-gateway                → api-gateway"
  echo "applicant-service          → applicant-service"
  echo "admin-service              → admin-service"
  echo "job-skill-service          → job-skill-service"
  echo "notification-service       → notification-service"
  echo "work-history-service       → work-history-service"
  echo "job-application-service    → job-applicant-service"
  echo "education-service          → education-service"
  echo ""
}

check_railway_cli() {
  if ! command -v railway &> /dev/null; then
    print_error "Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
  fi
}

check_railway_auth() {
  # Debug: show which tokens are available (without revealing values)
  if [ -n "$RAILWAY_TOKEN" ]; then
    print_info "RAILWAY_TOKEN is set"
  else
    print_warning "RAILWAY_TOKEN is not set"
  fi
  if [ -n "$PROJECT_TOKEN" ]; then
    print_info "PROJECT_TOKEN is set"
  else
    print_warning "PROJECT_TOKEN is not set"
  fi

  # CI/CD mode: check for authentication tokens
  if [ -n "$RAILWAY_TOKEN" ]; then
    print_info "Using RAILWAY_TOKEN for authentication"
  elif [ -n "$PROJECT_TOKEN" ]; then
    # Fall back to PROJECT_TOKEN if RAILWAY_TOKEN not set
    export RAILWAY_TOKEN="$PROJECT_TOKEN"
    print_info "Using PROJECT_TOKEN for authentication"
  else
    # Local mode: check if logged in
    if ! railway whoami &> /dev/null; then
      print_error "Not logged into Railway. Run: railway login"
      exit 1
    fi
  fi
}

check_railway_env() {
  # Determine if we're in CI/CD mode
  local is_cicd=false
  if [ -n "$RAILWAY_TOKEN" ] || [ -n "$PROJECT_TOKEN" ]; then
    is_cicd=true
  fi

  # For CI/CD, require RAILWAY_PROJECT_ID
  if [ "$is_cicd" = true ] && [ -z "$RAILWAY_PROJECT_ID" ]; then
    print_error "RAILWAY_PROJECT_ID is required in CI/CD mode"
    exit 1
  fi

  # Set default environment if not specified
  if [ -z "$RAILWAY_ENVIRONMENT" ]; then
    export RAILWAY_ENVIRONMENT="production"
  fi

  if [ -n "$RAILWAY_PROJECT_ID" ]; then
    print_info "Project: $RAILWAY_PROJECT_ID"
    print_info "Environment: $RAILWAY_ENVIRONMENT"
  fi
}

# Create railway.toml for specific service
create_railway_toml() {
  local folder="$1"
  local dockerfile_path="apps/$folder/Dockerfile"

  cat > "$RAILWAY_TOML" << EOF
[build]
dockerfilePath = "$dockerfile_path"
EOF

  print_info "Created railway.toml with dockerfilePath: $dockerfile_path"
}

# Cleanup railway.toml
cleanup_railway_toml() {
  if [ -f "$RAILWAY_TOML" ]; then
    rm "$RAILWAY_TOML"
    print_info "Cleaned up railway.toml"
  fi
}

# Trap to ensure cleanup on script exit
trap cleanup_railway_toml EXIT

# =============================================================================
# Deploy Function
# =============================================================================

deploy_service() {
  local folder="$1"
  local detach="${2:-true}"  # Default to detach mode
  local railway_service
  railway_service=$(get_railway_service "$folder")
  local service_path="$PROJECT_ROOT/apps/$folder"

  # Validate service exists in mapping
  if [ -z "$railway_service" ]; then
    print_error "Unknown service: $folder"
    print_info "Run './scripts/deploy-railway.sh --list' to see available services"
    return 1
  fi

  # Check if folder exists
  if [ ! -d "$service_path" ]; then
    print_error "Service folder not found: $service_path"
    return 1
  fi

  # Check if Dockerfile exists
  if [ ! -f "$service_path/Dockerfile" ]; then
    print_error "Dockerfile not found in: $service_path"
    return 1
  fi

  print_header "Deploying: $folder → $railway_service"

  # Work from project root
  cd "$PROJECT_ROOT"
  print_info "Working from: $(pwd)"

  # Create railway.toml with correct Dockerfile path
  create_railway_toml "$folder"

  # Deploy to Railway
  print_info "Deploying to Railway service: $railway_service"

  if [ -n "$RAILWAY_PROJECT_ID" ]; then
    # CI/CD mode: use PROJECT_TOKEN for deployment (contains project context)
    if [ -n "$PROJECT_TOKEN" ]; then
      print_info "Using PROJECT_TOKEN for deployment"
      if ! RAILWAY_TOKEN="$PROJECT_TOKEN" railway up --detach --service "$railway_service" --environment "$RAILWAY_ENVIRONMENT"; then
        print_error "Deployment failed for: $folder"
        return 1
      fi
    else
      # Fallback to RAILWAY_TOKEN if PROJECT_TOKEN not set
      if ! railway up --detach --service "$railway_service" --environment "$RAILWAY_ENVIRONMENT"; then
        print_error "Deployment failed for: $folder"
        return 1
      fi
    fi
  else
    # Local mode: link first, then deploy
    print_info "Linking to Railway service: $railway_service"
    if ! railway link -s "$railway_service"; then
      print_error "Failed to link to Railway service: $railway_service"
      return 1
    fi
    print_success "Linked to $railway_service"

    if ! railway up --detach; then
      print_error "Deployment failed for: $folder"
      return 1
    fi
  fi
  print_success "Deployment initiated for $folder"

  # Wait for Railway to finish uploading and reading railway.toml
  # Longer wait when deploying all services to ensure proper file handling
  if [ "$detach" = "false" ]; then
    print_info "Waiting for build to start (10s)..."
    sleep 10
  else
    sleep 3
  fi

  # Cleanup for next service
  cleanup_railway_toml

  return 0
}

deploy_all() {
  print_header "Deploying All Services"

  local failed_services=""
  local success_count=0
  local fail_count=0

  for folder in $ALL_SERVICES; do
    if [ -d "$PROJECT_ROOT/apps/$folder" ]; then
      # Pass 'false' to disable detach mode - wait for each deployment to complete
      if deploy_service "$folder" "false"; then
        success_count=$((success_count + 1))
      else
        failed_services="$failed_services $folder"
        fail_count=$((fail_count + 1))
      fi
    else
      print_warning "Skipping $folder (folder not found)"
    fi
  done

  # Summary
  print_header "Deployment Summary"
  print_success "Successful: $success_count"

  if [ $fail_count -gt 0 ]; then
    print_error "Failed: $fail_count"
    for svc in $failed_services; do
      echo "  - $svc"
    done
    exit 1
  fi

  echo ""
  print_info "Check deployment status with: railway status"
  print_info "Or view in dashboard: railway open"
}

show_help() {
  echo "Usage: $0 <service-name|--all|--list>"
  echo ""
  echo "Commands:"
  echo "  <service>   Deploy a specific service (folder name)"
  echo "  --all, -a   Deploy all services"
  echo "  --list, -l  List available services"
  echo "  --help, -h  Show this help"
  echo ""
  echo "Examples:"
  echo "  $0 applicant-service    # Deploy single service"
  echo "  $0 --all                # Deploy all services"
}

# =============================================================================
# Main
# =============================================================================

main() {
  check_railway_cli
  check_railway_auth
  check_railway_env

  cd "$PROJECT_ROOT"

  case "${1:-}" in
    --list|-l)
      list_services
      ;;
    --all|-a)
      deploy_all
      ;;
    --help|-h|"")
      show_help
      ;;
    *)
      deploy_service "$1"
      ;;
  esac
}

main "$@"
