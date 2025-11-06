#!/bin/bash

# B3 AI Analysis Platform - System Manager
# Gerencia todo o ciclo de vida do sistema

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Helper functions
print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  ${1}${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
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

print_step() {
    echo -e "${MAGENTA}▶${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado"
        echo "Instale Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker ps &> /dev/null; then
        print_error "Docker não está rodando"
        echo "Inicie o Docker Desktop ou execute: sudo systemctl start docker"
        exit 1
    fi
}

# Check if updates are available
check_for_updates() {
    print_info "Verificando atualizações do repositório..."

    # Fetch latest changes
    git fetch origin $(git branch --show-current) 2>/dev/null || true

    # Check if behind
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo $LOCAL)

    if [ "$LOCAL" != "$REMOTE" ]; then
        print_warning "Há atualizações disponíveis no repositório!"
        echo -n "Deseja atualizar o código? (y/n): "
        read -r UPDATE_CODE

        if [ "$UPDATE_CODE" == "y" ] || [ "$UPDATE_CODE" == "Y" ]; then
            print_step "Atualizando código..."
            git pull
            print_success "Código atualizado!"
            return 0  # Código foi atualizado
        else
            print_info "Continuando com versão local atual"
            return 1  # Código não foi atualizado
        fi
    else
        print_success "Código está atualizado"
        return 1  # Já estava atualizado
    fi
}

# Check if dependencies need to be installed/updated
check_dependencies() {
    local NEEDS_INSTALL=false
    local NEEDS_UPDATE=false

    print_info "Verificando dependências do projeto..."

    # Check backend
    if [ ! -d "backend/node_modules" ]; then
        print_warning "Backend: node_modules não encontrado"
        NEEDS_INSTALL=true
    elif [ "backend/package.json" -nt "backend/node_modules" ]; then
        print_warning "Backend: package.json foi modificado"
        NEEDS_UPDATE=true
    fi

    # Check frontend
    if [ ! -d "frontend/node_modules" ]; then
        print_warning "Frontend: node_modules não encontrado"
        NEEDS_INSTALL=true
    elif [ "frontend/package.json" -nt "frontend/node_modules" ]; then
        print_warning "Frontend: package.json foi modificado"
        NEEDS_UPDATE=true
    fi

    if [ "$NEEDS_INSTALL" = true ]; then
        print_warning "⚠️  Dependências precisam ser instaladas!"
        echo -n "Deseja instalar as dependências agora? (y/n): "
        read -r INSTALL_DEPS

        if [ "$INSTALL_DEPS" == "y" ] || [ "$INSTALL_DEPS" == "Y" ]; then
            install_deps
            return 0  # Instalou
        else
            print_error "Sistema não pode iniciar sem dependências!"
            echo "Execute: $0 install"
            exit 1
        fi
    elif [ "$NEEDS_UPDATE" = true ]; then
        print_warning "⚠️  Dependências podem estar desatualizadas!"
        echo -n "Deseja atualizar as dependências? (y/n): "
        read -r UPDATE_DEPS

        if [ "$UPDATE_DEPS" == "y" ] || [ "$UPDATE_DEPS" == "Y" ]; then
            install_deps
            return 0  # Atualizou
        else
            print_info "Continuando com dependências atuais..."
            return 1  # Não atualizou
        fi
    else
        print_success "Dependências estão instaladas"
        return 1  # Não precisou instalar/atualizar
    fi
}

# Check if Docker images need rebuild
check_docker_images() {
    print_info "Verificando imagens Docker..."

    # Check if Dockerfiles were modified
    NEEDS_REBUILD=false

    if [ ! "$(docker images -q invest_backend 2>/dev/null)" ]; then
        print_warning "Imagem do backend não encontrada"
        NEEDS_REBUILD=true
    fi

    if [ ! "$(docker images -q invest_frontend 2>/dev/null)" ]; then
        print_warning "Imagem do frontend não encontrada"
        NEEDS_REBUILD=true
    fi

    if [ "$NEEDS_REBUILD" = true ]; then
        print_warning "⚠️  Imagens Docker precisam ser construídas!"
        echo -n "Deseja fazer o build agora? (y/n): "
        read -r BUILD_IMAGES

        if [ "$BUILD_IMAGES" == "y" ] || [ "$BUILD_IMAGES" == "Y" ]; then
            print_step "Fazendo build das imagens..."
            docker-compose build
            print_success "Build concluído!"
            return 0  # Fez build
        else
            print_info "Continuando sem rebuild..."
            return 1  # Não fez build
        fi
    else
        print_success "Imagens Docker estão disponíveis"
        return 1  # Não precisou rebuild
    fi
}

# Install dependencies
install_deps() {
    print_header "Instalando/Atualizando Dependências"

    print_step "Backend dependencies..."
    cd backend
    if [ -f "package.json" ]; then
        npm install
        print_success "Backend dependencies instaladas"
    else
        print_error "backend/package.json não encontrado"
    fi
    cd ..

    print_step "Frontend dependencies..."
    cd frontend
    if [ -f "package.json" ]; then
        npm install
        print_success "Frontend dependencies instaladas"
    else
        print_error "frontend/package.json não encontrado"
    fi
    cd ..

    print_success "Todas as dependências foram instaladas/atualizadas!"
}

# Start system
start_system() {
    print_header "Iniciando Sistema B3 AI Analysis Platform"

    check_docker

    # Check for code updates
    check_for_updates
    CODE_UPDATED=$?

    # Check and install/update dependencies
    check_dependencies
    DEPS_CHANGED=$?

    # Check and rebuild Docker images if needed
    check_docker_images
    IMAGES_CHANGED=$?

    # If code or deps changed, suggest rebuild
    if [ $CODE_UPDATED -eq 0 ] || [ $DEPS_CHANGED -eq 0 ]; then
        print_info "💡 Recomendação: Como houve mudanças, considere fazer rebuild das imagens"
        echo -n "Deseja fazer rebuild agora? (y/n): "
        read -r REBUILD_NOW

        if [ "$REBUILD_NOW" == "y" ] || [ "$REBUILD_NOW" == "Y" ]; then
            print_step "Fazendo rebuild das imagens Docker..."
            docker-compose build
            print_success "Rebuild concluído!"
        fi
    fi

    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado"
        if [ -f ".env.example" ]; then
            print_info "Criando .env a partir de .env.example"
            cp .env.example .env
            print_warning "⚠️  IMPORTANTE: Configure o arquivo .env antes de continuar!"
            echo "Edite .env e configure:"
            echo "  - OPENAI_API_KEY (obrigatório para funcionalidades de IA)"
            echo "  - JWT_SECRET (mínimo 32 caracteres)"
            echo "  - Senhas do banco de dados (para produção)"
            echo ""
            echo -n "Pressione ENTER para continuar após configurar o .env..."
            read
        fi
    fi

    print_step "Iniciando serviços Docker..."
    docker-compose up -d

    print_info "Aguardando serviços ficarem prontos..."
    sleep 10

    # Check services
    print_step "Verificando status dos serviços..."

    # PostgreSQL
    if docker-compose exec -T postgres pg_isready -U invest_user -d invest_db &> /dev/null; then
        print_success "PostgreSQL está pronto"
    else
        print_warning "PostgreSQL ainda não está pronto"
    fi

    # Redis
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis está pronto"
    else
        print_warning "Redis ainda não está pronto"
    fi

    # Wait for backend
    print_step "Aguardando Backend..."
    for i in {1..30}; do
        if curl -s http://localhost:3101/health > /dev/null 2>&1; then
            print_success "Backend está pronto"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Backend demorou para iniciar. Verifique os logs: docker-compose logs backend"
        fi
        sleep 2
    done

    # Wait for frontend
    print_step "Aguardando Frontend..."
    for i in {1..30}; do
        if curl -s http://localhost:3100 > /dev/null 2>&1; then
            print_success "Frontend está pronto"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Frontend demorou para iniciar. Verifique os logs: docker-compose logs frontend"
        fi
        sleep 2
    done

    print_header "Sistema Iniciado!"
    echo ""
    echo -e "${GREEN}🌐 URLs de Acesso:${NC}"
    echo "  Frontend:    http://localhost:3100"
    echo "  Backend API: http://localhost:3101"
    echo "  API Docs:    http://localhost:3101/api/docs"
    echo "  PostgreSQL:  localhost:5532"
    echo "  Redis:       localhost:6479"
    echo ""
    echo -e "${BLUE}📊 Ferramentas de Dev:${NC}"
    echo "  PgAdmin:     http://localhost:5150 (docker-compose --profile dev up -d pgadmin)"
    echo "  Redis UI:    http://localhost:8181 (docker-compose --profile dev up -d redis-commander)"
    echo ""
}

# Stop system
stop_system() {
    print_header "Parando Sistema"

    check_docker

    print_step "Parando serviços Docker..."
    docker-compose down

    print_success "Todos os serviços foram parados!"
}

# Restart system
restart_system() {
    print_header "Reiniciando Sistema"

    stop_system
    sleep 2
    start_system
}

# Check status
check_status() {
    print_header "Status do Sistema"

    check_docker

    echo -e "${CYAN}📦 Containers Docker:${NC}"
    docker-compose ps
    echo ""

    echo -e "${CYAN}🏥 Health Checks:${NC}"

    # PostgreSQL
    if docker-compose exec -T postgres pg_isready -U invest_user -d invest_db &> /dev/null 2>&1; then
        print_success "PostgreSQL: HEALTHY"
    else
        print_error "PostgreSQL: DOWN"
    fi

    # Redis
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis: HEALTHY"
    else
        print_error "Redis: DOWN"
    fi

    # Backend
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3101/health 2>/dev/null)
    if [ "$BACKEND_STATUS" == "200" ]; then
        print_success "Backend: HEALTHY (HTTP 200)"
    else
        print_error "Backend: DOWN (HTTP $BACKEND_STATUS)"
    fi

    # Frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 2>/dev/null)
    if [ "$FRONTEND_STATUS" == "200" ]; then
        print_success "Frontend: HEALTHY (HTTP 200)"
    else
        print_error "Frontend: DOWN (HTTP $FRONTEND_STATUS)"
    fi

    echo ""
    echo -e "${CYAN}💾 Recursos do Sistema:${NC}"

    # Docker stats
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose ps -q) 2>/dev/null || true

    echo ""
}

# View logs
view_logs() {
    SERVICE=$1

    if [ -z "$SERVICE" ]; then
        print_error "Especifique um serviço: backend, frontend, postgres, redis, scrapers"
        echo "Exemplo: $0 logs backend"
        exit 1
    fi

    print_header "Logs: $SERVICE"
    docker-compose logs -f --tail=100 "$SERVICE"
}

# Quick health check
health_check() {
    print_header "Health Check Rápido"

    TOTAL=0
    HEALTHY=0

    # PostgreSQL
    ((TOTAL++))
    if docker-compose exec -T postgres pg_isready -U invest_user -d invest_db &> /dev/null 2>&1; then
        print_success "PostgreSQL"
        ((HEALTHY++))
    else
        print_error "PostgreSQL"
    fi

    # Redis
    ((TOTAL++))
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        print_success "Redis"
        ((HEALTHY++))
    else
        print_error "Redis"
    fi

    # Backend
    ((TOTAL++))
    if curl -s http://localhost:3101/health > /dev/null 2>&1; then
        print_success "Backend"
        ((HEALTHY++))
    else
        print_error "Backend"
    fi

    # Frontend
    ((TOTAL++))
    if curl -s http://localhost:3100 > /dev/null 2>&1; then
        print_success "Frontend"
        ((HEALTHY++))
    else
        print_error "Frontend"
    fi

    echo ""
    PERCENTAGE=$((HEALTHY * 100 / TOTAL))

    if [ $HEALTHY -eq $TOTAL ]; then
        echo -e "${GREEN}✓ Sistema 100% Operacional ($HEALTHY/$TOTAL)${NC}"
    elif [ $HEALTHY -gt 0 ]; then
        echo -e "${YELLOW}⚠ Sistema Parcialmente Operacional ($HEALTHY/$TOTAL = $PERCENTAGE%)${NC}"
    else
        echo -e "${RED}✗ Sistema Inoperante ($HEALTHY/$TOTAL)${NC}"
    fi
}

# Build containers
build_system() {
    print_header "Build dos Containers"

    check_docker

    print_step "Fazendo build das imagens Docker..."
    docker-compose build

    print_success "Build concluído!"
}

# Clean system (remove volumes)
clean_system() {
    print_header "Limpeza Completa do Sistema"

    print_warning "Isso vai REMOVER todos os dados (banco de dados, cache, etc.)"
    echo -n "Tem certeza? (yes/no): "
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        print_info "Operação cancelada"
        exit 0
    fi

    print_step "Parando e removendo containers, volumes e redes..."
    docker-compose down -v

    print_success "Sistema limpo! Volumes removidos."
    print_info "Para reiniciar: $0 start"
}

# Show usage
show_usage() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         B3 AI Analysis Platform - System Manager         ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Uso: $0 <comando> [opções]"
    echo ""
    echo -e "${GREEN}Comandos Principais:${NC}"
    echo "  start       - Inicia todo o sistema de forma inteligente"
    echo "                  ✓ Verifica atualizações do Git"
    echo "                  ✓ Detecta se precisa instalar dependências"
    echo "                  ✓ Verifica se precisa rebuild do Docker"
    echo "                  ✓ Oferece opção de instalar/atualizar automaticamente"
    echo "                  ✓ Mantém sistema sempre atualizado"
    echo "  stop        - Para todo o sistema"
    echo "  restart     - Reinicia o sistema"
    echo "  status      - Mostra status detalhado de todos os componentes"
    echo "  health      - Health check rápido"
    echo ""
    echo -e "${GREEN}Comandos de Desenvolvimento:${NC}"
    echo "  install     - Instala/atualiza dependências (npm install)"
    echo "  build       - Build das imagens Docker"
    echo "  logs <srv>  - Visualiza logs de um serviço"
    echo "                Serviços: backend, frontend, postgres, redis, scrapers"
    echo ""
    echo -e "${GREEN}Comandos Utilitários:${NC}"
    echo "  clean       - Remove TODOS os dados (volumes, cache, etc.)"
    echo "  help        - Mostra esta ajuda"
    echo ""
    echo -e "${YELLOW}Exemplos:${NC}"
    echo "  $0 start                 # Inicia com verificações automáticas"
    echo "  $0 status                # Verifica status"
    echo "  $0 logs backend          # Ver logs do backend"
    echo "  $0 health                # Health check rápido"
    echo ""
    echo -e "${MAGENTA}🚀 Fluxo Inteligente do START:${NC}"
    echo "  1. Verifica se há atualizações no Git → oferece pull"
    echo "  2. Verifica dependências (node_modules) → oferece install"
    echo "  3. Verifica imagens Docker → oferece build"
    echo "  4. Sugere rebuild se houve mudanças"
    echo "  5. Inicia serviços e aguarda ficarem prontos"
    echo "  6. Mostra URLs de acesso"
    echo ""
    echo -e "${BLUE}Scripts de Validação:${NC}"
    echo "  ./validate-system.sh              # Valida estrutura completa"
    echo "  ./docker-test.sh                  # Testa Docker setup"
    echo "  ./validate-all-requirements.sh    # Valida 76 requisitos"
    echo ""
}

# Main execution
main() {
    cd "$(dirname "$0")"  # Change to script directory

    COMMAND=${1:-help}

    case "$COMMAND" in
        start)
            start_system
            ;;
        stop)
            stop_system
            ;;
        restart)
            restart_system
            ;;
        status)
            check_status
            ;;
        health)
            health_check
            ;;
        install)
            install_deps
            ;;
        build)
            build_system
            ;;
        logs)
            view_logs "$2"
            ;;
        clean)
            clean_system
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Comando desconhecido: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# Run main
main "$@"
