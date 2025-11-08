#!/bin/bash

##############################################################################
# B3 AI Analysis Platform - Script de Parada do Ambiente de Desenvolvimento
#
# Este script para todos os serviços do ambiente de desenvolvimento local
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
    echo -e "${BLUE}==>${NC} ${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Banner
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${RED}🛑 B3 AI Analysis Platform - Parando Ambiente de Desenvolvimento${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

##############################################################################
# PASSO 1: Parar Frontend
##############################################################################
print_step "1/4 Parando Frontend Next.js..."

pkill -f "next dev" 2>/dev/null && print_success "Frontend parado" || print_success "Frontend já estava parado"
sleep 1

##############################################################################
# PASSO 2: Parar Backend
##############################################################################
print_step "2/4 Parando Backend NestJS..."

pkill -f "nest start" 2>/dev/null && print_success "Backend parado" || print_success "Backend já estava parado"
sleep 1

##############################################################################
# PASSO 3: Parar Redis
##############################################################################
print_step "3/4 Parando Redis..."

if redis-cli ping &>/dev/null; then
    redis-cli shutdown &>/dev/null && print_success "Redis parado" || print_success "Redis já estava parado"
else
    print_success "Redis já estava parado"
fi

##############################################################################
# PASSO 4: Parar PostgreSQL
##############################################################################
print_step "4/4 Parando PostgreSQL..."

if pg_isready &>/dev/null; then
    service postgresql stop
    print_success "PostgreSQL parado"
else
    print_success "PostgreSQL já estava parado"
fi

##############################################################################
# RESUMO
##############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ TODOS OS SERVIÇOS FORAM PARADOS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 PARA INICIAR NOVAMENTE:"
echo ""
echo -e "  ${GREEN}./start-dev.sh${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
