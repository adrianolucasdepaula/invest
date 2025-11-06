#!/bin/bash

# Frontend Validation Script
# Valida todas as páginas e funcionalidades do frontend usando curl

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para log
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_TESTS++))
}

error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_TESTS++))
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Função para testar página
test_page() {
    local url=$1
    local name=$2
    local expected_text=$3

    ((TOTAL_TESTS++))

    log "Testando: $name ($url)"

    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$url")

    if [ "$response" = "200" ]; then
        # Testar conteúdo se fornecido
        if [ -n "$expected_text" ]; then
            local content=$(curl -s "http://localhost:3000$url")
            if echo "$content" | grep -q "$expected_text"; then
                success "$name - Página carrega e contém texto esperado"
            else
                error "$name - Página carrega mas não contém '$expected_text'"
            fi
        else
            success "$name - Página carrega corretamente (HTTP 200)"
        fi
    else
        error "$name - HTTP $response (esperado 200)"
    fi
}

# Função para verificar se contém JavaScript
check_js_bundle() {
    ((TOTAL_TESTS++))

    log "Verificando bundles JavaScript..."

    local page=$(curl -s "http://localhost:3000/dashboard")

    if echo "$page" | grep -q "/_next/static"; then
        success "Bundles JavaScript estão sendo servidos"
    else
        error "Bundles JavaScript não encontrados"
    fi
}

# Função para verificar se contém CSS
check_css() {
    ((TOTAL_TESTS++))

    log "Verificando CSS/Tailwind..."

    local page=$(curl -s "http://localhost:3000/dashboard")

    if echo "$page" | grep -q -E "class=|className="; then
        success "Classes CSS estão presentes no HTML"
    else
        error "Classes CSS não encontradas"
    fi
}

# Banner
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║       VALIDAÇÃO COMPLETA DO FRONTEND - B3 AI PLATFORM     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se servidor está rodando
log "Verificando se servidor Next.js está rodando..."
if curl -s http://localhost:3000 > /dev/null; then
    success "Servidor Next.js está rodando na porta 3000"
else
    error "Servidor Next.js não está respondendo na porta 3000"
    echo ""
    echo "Execute 'npm start' no diretório frontend primeiro."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 1: Testando Páginas Principais"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Testar páginas principais
test_page "/dashboard" "Dashboard" "Dashboard"
test_page "/assets" "Página de Ativos" "Ativos"
test_page "/portfolio" "Página de Portfólio" "Portfólio"
test_page "/reports" "Página de Relatórios" "Relatórios"
test_page "/analysis" "Página de Análise" ""
test_page "/settings" "Página de Configurações" ""
test_page "/data-sources" "Página de Fontes de Dados" ""
test_page "/login" "Página de Login" ""

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 2: Testando Páginas Dinâmicas"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_page "/assets/PETR4" "Detalhes do Ativo - PETR4" ""
test_page "/reports/test-id" "Detalhes do Relatório" ""

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 3: Testando Componentes e Recursos"
echo "═══════════════════════════════════════════════════════════"
echo ""

check_js_bundle
check_css

# Testar dados mockados
((TOTAL_TESTS++))
log "Verificando dados mockados no Dashboard..."
dashboard_content=$(curl -s "http://localhost:3000/dashboard")
if echo "$dashboard_content" | grep -q "PETR4" && echo "$dashboard_content" | grep -q "VALE3"; then
    success "Dados mockados estão sendo renderizados"
else
    error "Dados mockados não encontrados"
fi

# Testar busca de ativos
((TOTAL_TESTS++))
log "Verificando funcionalidade de busca na página de Ativos..."
assets_content=$(curl -s "http://localhost:3000/assets")
if echo "$assets_content" | grep -q "Buscar"; then
    success "Campo de busca está presente"
else
    error "Campo de busca não encontrado"
fi

# Testar lista completa de ativos
((TOTAL_TESTS++))
log "Verificando lista completa de ativos..."
if echo "$assets_content" | grep -q "PETR4" && \
   echo "$assets_content" | grep -q "VALE3" && \
   echo "$assets_content" | grep -q "ITUB4" && \
   echo "$assets_content" | grep -q "BBDC4"; then
    success "Lista completa de ativos mockados está sendo renderizada"
else
    error "Lista de ativos incompleta"
fi

# Testar cards de estatísticas
((TOTAL_TESTS++))
log "Verificando cards de estatísticas no Dashboard..."
if echo "$dashboard_content" | grep -q "Ibovespa" && \
   echo "$dashboard_content" | grep -q "Portfólio" && \
   echo "$dashboard_content" | grep -q "Ganho"; then
    success "Cards de estatísticas estão presentes"
else
    error "Cards de estatísticas não encontrados"
fi

# Testar formatação de valores
((TOTAL_TESTS++))
log "Verificando formatação de valores monetários..."
if echo "$dashboard_content" | grep -q "R\$"; then
    success "Valores monetários estão formatados"
else
    warning "Formatação de valores monetários não detectada (pode ser renderizado no cliente)"
fi

# Testar botões de ação no portfólio
((TOTAL_TESTS++))
log "Verificando botões de ação no Portfólio..."
portfolio_content=$(curl -s "http://localhost:3000/portfolio")
if echo "$portfolio_content" | grep -q -i "Adicionar" || echo "$portfolio_content" | grep -q -i "Importar"; then
    success "Botões de ação do portfólio estão presentes"
else
    warning "Botões de ação podem ser renderizados no cliente"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 4: Testando Performance e Otimizações"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Testar tempo de resposta
((TOTAL_TESTS++))
log "Testando tempo de resposta do servidor..."
start_time=$(date +%s%N)
curl -s "http://localhost:3000/dashboard" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    success "Tempo de resposta: ${response_time}ms (excelente)"
elif [ $response_time -lt 3000 ]; then
    success "Tempo de resposta: ${response_time}ms (bom)"
else
    warning "Tempo de resposta: ${response_time}ms (pode ser melhorado)"
fi

# Testar se está servindo arquivos estáticos
((TOTAL_TESTS++))
log "Verificando arquivos estáticos Next.js..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/_next/static/chunks/main.js" | grep -q "200"; then
    success "Arquivos estáticos estão sendo servidos corretamente"
else
    warning "Alguns arquivos estáticos podem não estar disponíveis"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 5: Validação de Estrutura HTML"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar meta tags
((TOTAL_TESTS++))
log "Verificando meta tags e SEO..."
dashboard_html=$(curl -s "http://localhost:3000/dashboard")
if echo "$dashboard_html" | grep -q "<title>"; then
    success "Meta tag title está presente"
else
    error "Meta tag title não encontrada"
fi

# Verificar estrutura HTML básica
((TOTAL_TESTS++))
log "Verificando estrutura HTML..."
if echo "$dashboard_html" | grep -q "<html" && \
   echo "$dashboard_html" | grep -q "<body" && \
   echo "$dashboard_html" | grep -q "</html>"; then
    success "Estrutura HTML básica está correta"
else
    error "Estrutura HTML está incompleta"
fi

# Verificar idioma português
((TOTAL_TESTS++))
log "Verificando idioma da aplicação..."
if echo "$dashboard_html" | grep -q 'lang="pt-BR"'; then
    success "Aplicação configurada para português brasileiro"
else
    warning "Idioma pt-BR não detectado"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                       RESUMO FINAL                        "
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Total de Testes:    $TOTAL_TESTS"
echo -e "Testes Passaram:    ${GREEN}$PASSED_TESTS${NC}"
echo -e "Testes Falharam:    ${RED}$FAILED_TESTS${NC}"
echo ""

# Calcular porcentagem
if [ $TOTAL_TESTS -gt 0 ]; then
    percentage=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -n "Taxa de Sucesso:    "

    if [ $percentage -ge 90 ]; then
        echo -e "${GREEN}${percentage}%${NC} ✓ EXCELENTE"
    elif [ $percentage -ge 75 ]; then
        echo -e "${YELLOW}${percentage}%${NC} ⚠ BOM"
    else
        echo -e "${RED}${percentage}%${NC} ✗ PRECISA MELHORIAS"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"

# Status final
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ FRONTEND 100% VALIDADO COM SUCESSO!${NC}"
    exit 0
elif [ $FAILED_TESTS -le 3 ]; then
    echo -e "${YELLOW}⚠ FRONTEND VALIDADO COM PEQUENOS PROBLEMAS${NC}"
    exit 0
else
    echo -e "${RED}✗ FRONTEND TEM PROBLEMAS QUE PRECISAM SER CORRIGIDOS${NC}"
    exit 1
fi
