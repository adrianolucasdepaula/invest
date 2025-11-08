#!/bin/bash

# B3 AI Analysis Platform - Docker Test Script
# This script validates and tests the Docker Compose setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    print_header "Phase 1: Checking Prerequisites"

    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker is installed: $DOCKER_VERSION"
    else
        print_error "Docker is not installed"
        echo "Install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose is installed: $COMPOSE_VERSION"
    elif docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_success "Docker Compose (plugin) is installed: $COMPOSE_VERSION"
        # Use docker compose instead of docker-compose
        alias docker-compose='docker compose'
    else
        print_error "Docker Compose is not installed"
        echo "Install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # Check if Docker daemon is running
    if docker ps &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        echo "Start Docker Desktop or run: sudo systemctl start docker"
        exit 1
    fi

    # Check available disk space
    AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -lt 10 ]; then
        print_warning "Low disk space: ${AVAILABLE_SPACE}GB available (recommend 10GB+)"
    else
        print_success "Sufficient disk space: ${AVAILABLE_SPACE}GB available"
    fi

    # Check available memory
    if command -v free &> /dev/null; then
        AVAILABLE_MEM=$(free -g | awk '/^Mem:/{print $7}')
        if [ "$AVAILABLE_MEM" -lt 4 ]; then
            print_warning "Low memory: ${AVAILABLE_MEM}GB available (recommend 4GB+)"
        else
            print_success "Sufficient memory: ${AVAILABLE_MEM}GB available"
        fi
    fi
}

# Validate configuration files
validate_config() {
    print_header "Phase 2: Validating Configuration Files"

    # Check docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        print_success "docker-compose.yml exists"

        # Validate syntax
        if docker-compose config > /dev/null 2>&1; then
            print_success "docker-compose.yml syntax is valid"
        else
            print_error "docker-compose.yml has syntax errors"
            docker-compose config
            exit 1
        fi
    else
        print_error "docker-compose.yml not found"
        exit 1
    fi

    # Check .env file
    if [ -f ".env" ]; then
        print_success ".env file exists"
    else
        print_warning ".env file not found"
        if [ -f ".env.example" ]; then
            print_info "Creating .env from .env.example"
            cp .env.example .env
            print_warning "Please update .env with your configuration"
            echo "Especially update:"
            echo "  - JWT_SECRET (must be at least 32 characters)"
            echo "  - OPENAI_API_KEY (if using AI features)"
            echo "  - Database passwords for production"
        fi
    fi

    # Check required directories
    REQUIRED_DIRS=(
        "backend"
        "frontend"
        "database"
        "docker/nginx"
    )

    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            print_success "Directory exists: $dir"
        else
            print_error "Required directory missing: $dir"
            exit 1
        fi
    done

    # Check nginx configuration
    if [ -f "docker/nginx/nginx.conf" ]; then
        print_success "nginx.conf exists"
    else
        print_warning "nginx.conf not found (needed for production profile)"
    fi

    # Check for SSL certificates (production)
    if [ -f "docker/nginx/ssl/cert.pem" ] && [ -f "docker/nginx/ssl/key.pem" ]; then
        print_success "SSL certificates found"
    else
        print_warning "SSL certificates not found (needed for production HTTPS)"
        print_info "See docker/nginx/ssl/README.md for setup instructions"
    fi
}

# Test Docker Compose services
test_services() {
    print_header "Phase 3: Testing Docker Compose Services"

    print_info "Pulling Docker images..."
    docker-compose pull

    print_info "Building custom images..."
    docker-compose build

    print_success "All images built successfully"

    print_info "Starting services (this may take a few minutes)..."
    docker-compose up -d

    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 10

    # Check service status
    print_info "Checking service status..."
    docker-compose ps

    # Check PostgreSQL
    print_info "Testing PostgreSQL connection..."
    if docker-compose exec -T postgres pg_isready -U invest_user -d invest_db &> /dev/null; then
        print_success "PostgreSQL is ready"
    else
        print_error "PostgreSQL is not ready"
    fi

    # Check Redis
    print_info "Testing Redis connection..."
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis is ready"
    else
        print_error "Redis is not ready"
    fi

    # Wait for backend to be ready
    print_info "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3101/health > /dev/null 2>&1; then
            print_success "Backend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend failed to start"
            print_info "Check logs with: docker-compose logs backend"
        fi
        sleep 2
    done

    # Wait for frontend to be ready
    print_info "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3100 > /dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Frontend failed to start"
            print_info "Check logs with: docker-compose logs frontend"
        fi
        sleep 2
    done
}

# Test API endpoints
test_endpoints() {
    print_header "Phase 4: Testing API Endpoints"

    # Test health endpoint
    print_info "Testing backend health endpoint..."
    HEALTH_RESPONSE=$(curl -s http://localhost:3101/health)
    if echo "$HEALTH_RESPONSE" | grep -q "ok\|healthy"; then
        print_success "Health endpoint is working"
    else
        print_warning "Health endpoint returned unexpected response"
        echo "Response: $HEALTH_RESPONSE"
    fi

    # Test API endpoint
    print_info "Testing API endpoint..."
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3101/api)
    if [ "$API_RESPONSE" -eq 200 ] || [ "$API_RESPONSE" -eq 404 ]; then
        print_success "API endpoint is responding (HTTP $API_RESPONSE)"
    else
        print_warning "API endpoint returned HTTP $API_RESPONSE"
    fi

    # Test frontend
    print_info "Testing frontend..."
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100)
    if [ "$FRONTEND_RESPONSE" -eq 200 ]; then
        print_success "Frontend is responding (HTTP $FRONTEND_RESPONSE)"
    else
        print_warning "Frontend returned HTTP $FRONTEND_RESPONSE"
    fi
}

# Check logs for errors
check_logs() {
    print_header "Phase 5: Checking Service Logs"

    SERVICES=("postgres" "redis" "backend" "frontend")

    for service in "${SERVICES[@]}"; do
        print_info "Checking $service logs for errors..."
        ERROR_COUNT=$(docker-compose logs --tail=100 $service 2>/dev/null | grep -i "error\|fatal\|exception" | wc -l)

        if [ "$ERROR_COUNT" -eq 0 ]; then
            print_success "$service: No errors found"
        else
            print_warning "$service: Found $ERROR_COUNT error messages"
            print_info "View full logs with: docker-compose logs $service"
        fi
    done
}

# Display summary
display_summary() {
    print_header "Test Summary"

    echo "Services Status:"
    docker-compose ps

    echo ""
    echo "Access URLs:"
    echo "  Frontend:  http://localhost:3100"
    echo "  Backend:   http://localhost:3101"
    echo "  API Docs:  http://localhost:3101/api/docs"
    echo "  PgAdmin:   http://localhost:5150 (dev profile)"
    echo "  Redis UI:  http://localhost:8181 (dev profile)"

    echo ""
    echo "Useful commands:"
    echo "  View logs:        docker-compose logs -f [service]"
    echo "  Stop services:    docker-compose down"
    echo "  Restart service:  docker-compose restart [service]"
    echo "  Shell access:     docker-compose exec [service] sh"
    echo "  Production mode:  docker-compose --profile production up -d"
    echo "  Dev tools:        docker-compose --profile dev up -d"

    echo ""
    print_success "Docker setup validation completed!"
}

# Cleanup function
cleanup() {
    if [ "$1" == "down" ]; then
        print_header "Cleaning Up"
        print_info "Stopping all services..."
        docker-compose down
        print_success "All services stopped"
    fi
}

# Main execution
main() {
    cd "$(dirname "$0")"  # Change to script directory

    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   B3 AI Analysis Platform - Docker Test Suite         ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""

    # Parse arguments
    if [ "$1" == "--cleanup" ]; then
        cleanup "down"
        exit 0
    fi

    check_prerequisites
    validate_config
    test_services
    test_endpoints
    check_logs
    display_summary

    echo ""
    print_info "To stop all services, run: ./docker-test.sh --cleanup"
    print_info "Or run: docker-compose down"
}

# Run main function
main "$@"
