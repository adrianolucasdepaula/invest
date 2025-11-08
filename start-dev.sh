#!/bin/bash

##############################################################################
# B3 AI Analysis Platform - Script de Inicialização do Ambiente de Desenvolvimento
#
# Este script inicia todos os serviços necessários para o ambiente de dev local
# sem Docker: PostgreSQL, Redis, Backend NestJS e Frontend Next.js
##############################################################################

set -e  # Exit on error

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_step() {
    echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Banner
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🚀 B3 AI Analysis Platform - Ambiente de Desenvolvimento${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    print_error "Execute este script a partir do diretório raiz do projeto!"
    exit 1
fi

##############################################################################
# PASSO 1: Iniciar PostgreSQL
##############################################################################
print_step "1/5 Iniciando PostgreSQL..."

if pg_isready &>/dev/null; then
    print_success "PostgreSQL já está rodando"
else
    service postgresql start
    sleep 3

    if pg_isready &>/dev/null; then
        print_success "PostgreSQL iniciado com sucesso (porta 5432)"
    else
        print_error "Falha ao iniciar PostgreSQL"
        exit 1
    fi
fi

##############################################################################
# PASSO 2: Iniciar Redis
##############################################################################
print_step "2/5 Iniciando Redis..."

if redis-cli ping &>/dev/null; then
    print_success "Redis já está rodando"
else
    redis-server --daemonize yes --port 6379
    sleep 2

    if redis-cli ping &>/dev/null; then
        print_success "Redis iniciado com sucesso (porta 6379)"
    else
        print_error "Falha ao iniciar Redis"
        exit 1
    fi
fi

##############################################################################
# PASSO 3: Verificar node_modules
##############################################################################
print_step "3/5 Verificando dependências..."

# Backend
if [ ! -d "backend/node_modules" ]; then
    print_warning "Dependências do backend não instaladas. Instalando..."
    cd backend
    npm install
    cd ..
    print_success "Dependências do backend instaladas"
else
    print_success "Dependências do backend OK"
fi

# Frontend
if [ ! -d "frontend/node_modules" ]; then
    print_warning "Dependências do frontend não instaladas. Instalando..."
    cd frontend
    npm install
    cd ..
    print_success "Dependências do frontend instaladas"
else
    print_success "Dependências do frontend OK"
fi

##############################################################################
# PASSO 4: Iniciar Backend
##############################################################################
print_step "4/5 Iniciando Backend NestJS..."

# Matar processos antigos do backend
pkill -f "nest start" 2>/dev/null || true
sleep 2

# Iniciar backend em background
cd backend
nohup npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar (máx 30s)
print_warning "Aguardando backend iniciar..."
for i in {1..30}; do
    if curl -s http://localhost:3101/api/v1/health &>/dev/null; then
        print_success "Backend iniciado com sucesso (porta 3101) - PID: $BACKEND_PID"
        break
    fi
    sleep 1
    echo -n "."
done

if ! curl -s http://localhost:3101/api/v1/health &>/dev/null; then
    print_warning "Backend demorou para iniciar, mas continua em background"
    print_warning "Verifique os logs em: tail -f /tmp/backend.log"
fi

##############################################################################
# PASSO 5: Iniciar Frontend
##############################################################################
print_step "5/5 Iniciando Frontend Next.js..."

# Matar processos antigos do frontend
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Iniciar frontend em background
cd frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Aguardar frontend iniciar (máx 20s)
print_warning "Aguardando frontend iniciar..."
for i in {1..20}; do
    if curl -s http://localhost:3000 &>/dev/null; then
        print_success "Frontend iniciado com sucesso (porta 3000) - PID: $FRONTEND_PID"
        break
    fi
    sleep 1
    echo -n "."
done

if ! curl -s http://localhost:3000 &>/dev/null; then
    print_warning "Frontend demorou para iniciar, mas continua em background"
    print_warning "Verifique os logs em: tail -f /tmp/frontend.log"
fi

##############################################################################
# RESUMO
##############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ AMBIENTE INICIADO COM SUCESSO!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 SERVIÇOS RODANDO:"
echo ""
echo -e "  ${GREEN}•${NC} PostgreSQL:  http://localhost:5432"
echo -e "  ${GREEN}•${NC} Redis:        http://localhost:6379"
echo -e "  ${GREEN}•${NC} Backend API:  http://localhost:3101"
echo -e "  ${GREEN}•${NC} Frontend:     http://localhost:3000"
echo ""
echo "📚 LINKS ÚTEIS:"
echo ""
echo -e "  ${BLUE}•${NC} API Docs:     http://localhost:3101/api/docs"
echo -e "  ${BLUE}•${NC} Health Check: http://localhost:3101/api/v1/health"
echo -e "  ${BLUE}•${NC} Dashboard:    http://localhost:3000/dashboard"
echo ""
echo "📝 LOGS:"
echo ""
echo -e "  ${YELLOW}•${NC} Backend:  tail -f /tmp/backend.log"
echo -e "  ${YELLOW}•${NC} Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 PARA PARAR O AMBIENTE:"
echo ""
echo -e "  ${RED}./stop-dev.sh${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
