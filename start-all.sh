#!/bin/bash

################################################################################
# B3 AI Analysis Platform - Complete Startup Script
#
# This script starts all services in the correct order:
# 1. Check prerequisites (Docker, Docker Compose)
# 2. Create required directories
# 3. Run database migrations
# 4. Start all services with docker-compose
# 5. Display status and access URLs
#
# Usage:
#   ./start-all.sh [--dev|--prod|--logs]
#
# Options:
#   --dev     Start in development mode (default)
#   --prod    Start in production mode
#   --logs    Show logs after starting
#   --help    Display this help message
#
# Author: B3 AI Analysis Platform Team
# Date: 2025-11-07
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODE="development"
SHOW_LOGS=false
PROFILE=""

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo "================================================================================"
    echo -e "${BLUE}$1${NC}"
    echo "================================================================================"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

################################################################################
# Parse Arguments
################################################################################

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev)
                MODE="development"
                PROFILE=""
                shift
                ;;
            --prod)
                MODE="production"
                PROFILE="--profile production"
                shift
                ;;
            --logs)
                SHOW_LOGS=true
                shift
                ;;
            --help)
                grep "^#" "$0" | grep -v "#!/bin/bash" | sed 's/^# //'
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

################################################################################
# Prerequisite Checks
################################################################################

check_prerequisites() {
    print_header "1. Checking Prerequisites"

    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
    else
        print_error "Docker not found. Please install Docker."
        exit 1
    fi

    # Check Docker Compose
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_success "Docker Compose found: $COMPOSE_VERSION"
    else
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi

    # Check if Docker daemon is running
    if docker ps &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    # Check .env file
    if [ -f ".env" ]; then
        print_success ".env file found"
    else
        print_warning ".env file not found. Copying from .env.example..."
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please review and update .env with your configuration"
    fi
}

################################################################################
# Create Required Directories
################################################################################

create_directories() {
    print_header "2. Creating Required Directories"

    # List of directories to create
    DIRS=(
        "logs"
        "data"
        "uploads"
        "reports"
        "browser-profiles"
        "config"
    )

    for dir in "${DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created directory: $dir"
        else
            print_info "Directory exists: $dir"
        fi
    done
}

################################################################################
# Database Setup
################################################################################

setup_database() {
    print_header "3. Database Setup"

    print_info "Starting database container..."
    docker compose up -d postgres

    print_info "Waiting for database to be ready..."
    sleep 10

    # Wait for database health check
    ATTEMPTS=0
    MAX_ATTEMPTS=30
    while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
        if docker compose ps postgres | grep -q "healthy"; then
            print_success "Database is ready"
            break
        fi
        ATTEMPTS=$((ATTEMPTS + 1))
        echo -n "."
        sleep 2
    done

    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        print_error "Database failed to start within timeout"
        exit 1
    fi

    print_info "Running database migrations..."
    # Add migration command here if needed
    # docker compose exec postgres psql -U invest_user -d invest_db -f /docker-entrypoint-initdb.d/init.sql
    print_success "Database setup complete"
}

################################################################################
# Start Services
################################################################################

start_services() {
    print_header "4. Starting All Services"

    print_info "Mode: $MODE"
    print_info "Starting services with docker-compose..."

    # Build and start all services
    docker compose $PROFILE up -d --build

    print_info "Waiting for services to be ready..."
    sleep 15

    print_success "All services started"
}

################################################################################
# Display Status
################################################################################

display_status() {
    print_header "5. Service Status"

    # Get container status
    docker compose ps

    echo ""
    print_header "6. Service Health Checks"

    # Check each service
    SERVICES=(
        "postgres:5432"
        "redis:6379"
        "api-service:8000"
        "backend:3101"
        "frontend:3000"
    )

    for service in "${SERVICES[@]}"; do
        IFS=':' read -r name port <<< "$service"
        CONTAINER="invest_$name"

        if docker ps --format '{{.Names}}' | grep -q "$CONTAINER"; then
            print_success "$name is running"
        else
            print_warning "$name is not running or not yet started"
        fi
    done
}

################################################################################
# Display Access URLs
################################################################################

display_urls() {
    print_header "7. Access URLs"

    echo "Frontend Application:"
    echo -e "  ${GREEN}http://localhost:3100${NC}"
    echo ""

    echo "Backend API (NestJS):"
    echo -e "  ${GREEN}http://localhost:3101/api/v1${NC}"
    echo ""

    echo "Scraper Test API (FastAPI):"
    echo -e "  ${GREEN}http://localhost:8000/docs${NC} (Swagger UI)"
    echo -e "  ${GREEN}http://localhost:8000/redoc${NC} (ReDoc)"
    echo ""

    echo "Database:"
    echo -e "  ${GREEN}postgresql://invest_user:invest_password@localhost:5532/invest_db${NC}"
    echo ""

    echo "Redis:"
    echo -e "  ${GREEN}redis://localhost:6479${NC}"
    echo ""

    if [ "$MODE" == "development" ]; then
        echo "Development Tools:"
        echo -e "  PgAdmin: ${GREEN}http://localhost:5150${NC}"
        echo -e "  Redis Commander: ${GREEN}http://localhost:8181${NC}"
        echo ""
    fi
}

################################################################################
# Display Management Commands
################################################################################

display_commands() {
    print_header "8. Management Commands"

    echo "View logs:"
    echo "  docker compose logs -f [service]"
    echo ""

    echo "Stop services:"
    echo "  docker compose down"
    echo ""

    echo "Stop and remove volumes:"
    echo "  docker compose down -v"
    echo ""

    echo "Restart a service:"
    echo "  docker compose restart [service]"
    echo ""

    echo "Execute command in container:"
    echo "  docker compose exec [service] [command]"
    echo ""

    echo "View service status:"
    echo "  docker compose ps"
    echo ""
}

################################################################################
# Show Logs
################################################################################

show_logs() {
    if [ "$SHOW_LOGS" = true ]; then
        print_header "Service Logs"
        print_info "Press Ctrl+C to exit logs"
        echo ""
        sleep 2
        docker compose logs -f
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    # Parse command-line arguments
    parse_args "$@"

    # Print banner
    echo ""
    echo "================================================================================"
    echo -e "${BLUE}     🚀 B3 AI Analysis Platform - Complete Startup Script 🚀${NC}"
    echo "================================================================================"
    echo ""

    # Run setup steps
    check_prerequisites
    create_directories
    setup_database
    start_services
    display_status
    display_urls
    display_commands

    # Final message
    print_header "✅ Startup Complete!"
    print_success "B3 AI Analysis Platform is running in $MODE mode"
    echo ""
    print_info "To view logs: ./start-all.sh --logs"
    print_info "To stop: docker compose down"
    echo ""

    # Show logs if requested
    show_logs
}

# Run main function
main "$@"
