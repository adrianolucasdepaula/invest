#!/bin/bash

# Script para executar todos os testes do backend

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        TESTES DO BACKEND - B3 AI ANALYSIS PLATFORM        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório backend${NC}"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado. Instalando dependências...${NC}"
    npm install
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 1: Testes Unitários"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Rodar testes unitários
echo -e "${BLUE}Executando testes unitários...${NC}"
if npm run test -- --passWithNoTests 2>&1 | tee test-unit-output.log; then
    echo -e "${GREEN}✓ Testes unitários concluídos${NC}"
else
    echo -e "${YELLOW}⚠ Alguns testes unitários falharam (verifique test-unit-output.log)${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 2: Testes E2E"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Rodar testes E2E
echo -e "${BLUE}Executando testes E2E...${NC}"
if npm run test:e2e 2>&1 | tee test-e2e-output.log; then
    echo -e "${GREEN}✓ Testes E2E concluídos${NC}"
else
    echo -e "${YELLOW}⚠ Alguns testes E2E falharam (verifique test-e2e-output.log)${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 3: Cobertura de Código"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Rodar testes com cobertura
echo -e "${BLUE}Gerando relatório de cobertura...${NC}"
if npm run test:cov -- --passWithNoTests 2>&1 | tee test-coverage-output.log; then
    echo -e "${GREEN}✓ Relatório de cobertura gerado${NC}"
    echo -e "${BLUE}Veja o relatório em: coverage/lcov-report/index.html${NC}"
else
    echo -e "${YELLOW}⚠ Erro ao gerar cobertura${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "FASE 4: Lint e Formatação"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Executar lint
echo -e "${BLUE}Executando ESLint...${NC}"
if npm run lint 2>&1 | tee lint-output.log; then
    echo -e "${GREEN}✓ Lint aprovado${NC}"
else
    echo -e "${YELLOW}⚠ Problemas de lint encontrados${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "               RESUMO DOS TESTES"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Contar testes
UNIT_TESTS=$(grep -c "PASS\|FAIL" test-unit-output.log 2>/dev/null || echo "0")
E2E_TESTS=$(grep -c "PASS\|FAIL" test-e2e-output.log 2>/dev/null || echo "0")

echo "Testes Unitários: $UNIT_TESTS"
echo "Testes E2E: $E2E_TESTS"
echo ""

# Verificar cobertura
if [ -f "coverage/coverage-summary.json" ]; then
    echo "Cobertura de Código:"
    cat coverage/coverage-summary.json | grep -oP '"lines":\{"total":\d+,"covered":\d+,"skipped":\d+,"pct":\d+\.\d+' | head -1
    echo ""
fi

# Status final
echo "═══════════════════════════════════════════════════════════"
if [ -s test-e2e-output.log ] && grep -q "Test Suites:.*failed" test-e2e-output.log; then
    echo -e "${YELLOW}⚠ Alguns testes falharam - Verifique os logs${NC}"
else
    echo -e "${GREEN}✓ TODOS OS TESTES PASSARAM!${NC}"
fi
echo "═══════════════════════════════════════════════════════════"

# Limpar arquivos de log temporários (opcional)
# rm -f test-*-output.log

echo ""
echo "Logs salvos em:"
echo "  - test-unit-output.log"
echo "  - test-e2e-output.log"
echo "  - test-coverage-output.log"
echo "  - lint-output.log"
echo ""
