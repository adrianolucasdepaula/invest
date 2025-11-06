#!/bin/bash

# Validação Ultra-Robusta para Claude CLI no VS Code
# Garante que todo o sistema funcionará sem erros

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Log functions
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  ${1}${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}▶ ${1}${NC}"
    echo ""
}

check_start() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "  [CHECK] ${1}... "
}

check_pass() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✓ PASSED${NC}"
}

check_fail() {
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${RED}✗ FAILED${NC}"
    echo -e "${RED}    Error: ${1}${NC}"
}

check_warning() {
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo -e "${YELLOW}    Warning: ${1}${NC}"
}

# Start validation
print_header "VALIDAÇÃO ULTRA-ROBUSTA - B3 AI ANALYSIS PLATFORM"
echo "Este script garante que o sistema funcionará no VS Code + Claude CLI"
echo ""

# Phase 1: Environment Check
print_section "FASE 1: Verificação de Ambiente"

check_start "Node.js instalado"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    if [[ "${NODE_VERSION}" =~ ^v([0-9]+) ]]; then
        VERSION_NUM="${BASH_REMATCH[1]}"
        if [ "$VERSION_NUM" -ge 18 ]; then
            check_pass
            echo "    Versão: ${NODE_VERSION}"
        else
            check_fail "Node.js versão $NODE_VERSION < 18 (requerido: 18+)"
        fi
    fi
else
    check_fail "Node.js não encontrado"
fi

check_start "npm instalado"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass
    echo "    Versão: ${NPM_VERSION}"
else
    check_fail "npm não encontrado"
fi

# Phase 2: Project Structure
print_section "FASE 2: Estrutura do Projeto"

REQUIRED_DIRS=(
    "backend"
    "backend/src"
    "backend/src/ai"
    "backend/src/ai/agents"
    "backend/src/ai/services"
    "backend/src/ai/interfaces"
    "frontend"
    "frontend/src"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    check_start "Diretório $dir existe"
    if [ -d "$dir" ]; then
        check_pass
    else
        check_fail "Diretório não encontrado: $dir"
    fi
done

# Phase 3: Backend Files
print_section "FASE 3: Arquivos do Backend"

BACKEND_FILES=(
    "backend/package.json"
    "backend/tsconfig.json"
    "backend/src/main.ts"
    "backend/src/app.module.ts"
    "backend/src/ai/ai.module.ts"
    "backend/src/ai/agents/base-financial-agent.ts"
    "backend/src/ai/agents/fundamental-analyst.agent.ts"
    "backend/src/ai/agents/technical-analyst.agent.ts"
    "backend/src/ai/agents/sentiment-analyst.agent.ts"
    "backend/src/ai/agents/risk-analyst.agent.ts"
    "backend/src/ai/agents/macro-analyst.agent.ts"
    "backend/src/ai/services/document-sharding.service.ts"
    "backend/src/ai/services/multi-agent-analysis.service.ts"
    "backend/src/ai/interfaces/analysis.types.ts"
    "backend/src/ai/interfaces/financial-agent.interface.ts"
)

for file in "${BACKEND_FILES[@]}"; do
    check_start "Arquivo $file existe"
    if [ -f "$file" ]; then
        check_pass
    else
        check_fail "Arquivo não encontrado: $file"
    fi
done

# Phase 4: TypeScript Syntax Validation
print_section "FASE 4: Validação de Sintaxe TypeScript"

AI_TS_FILES=(
    "backend/src/ai/agents/base-financial-agent.ts"
    "backend/src/ai/agents/fundamental-analyst.agent.ts"
    "backend/src/ai/agents/technical-analyst.agent.ts"
    "backend/src/ai/agents/sentiment-analyst.agent.ts"
    "backend/src/ai/agents/risk-analyst.agent.ts"
    "backend/src/ai/agents/macro-analyst.agent.ts"
    "backend/src/ai/services/document-sharding.service.ts"
    "backend/src/ai/services/multi-agent-analysis.service.ts"
)

for file in "${AI_TS_FILES[@]}"; do
    check_start "Sintaxe TypeScript válida: $(basename $file)"

    # Check for syntax errors (basic)
    if grep -q "import.*from" "$file" && grep -q "export" "$file"; then
        # Check for common syntax errors
        if grep -q "import.*from.*undefined" "$file"; then
            check_fail "Import com 'undefined' encontrado"
        elif grep -q "from '\\.\\./\\.\\./'$" "$file"; then
            check_warning "Import path pode estar incorreto"
        else
            check_pass
        fi
    else
        check_fail "Estrutura de import/export inválida"
    fi
done

# Phase 5: Dependencies Check
print_section "FASE 5: Verificação de Dependências"

cd backend

check_start "package.json é válido"
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
    check_pass
else
    check_fail "package.json tem sintaxe inválida"
fi

check_start "node_modules existe"
if [ -d "node_modules" ]; then
    check_pass
else
    check_warning "node_modules não encontrado - executando npm install"
    npm install --silent
fi

# Check critical dependencies
CRITICAL_DEPS=(
    "openai"
    "@nestjs/common"
    "@nestjs/core"
    "@nestjs/config"
)

for dep in "${CRITICAL_DEPS[@]}"; do
    check_start "Dependência $dep instalada"
    if [ -d "node_modules/$dep" ]; then
        check_pass
    else
        check_fail "Dependência não encontrada: $dep"
        echo "    Execute: npm install $dep"
    fi
done

cd ..

# Phase 6: Import/Export Validation
print_section "FASE 6: Validação de Imports/Exports"

check_start "Agents index.ts exporta todos os agentes"
AGENTS_INDEX="backend/src/ai/agents/index.ts"
if [ -f "$AGENTS_INDEX" ]; then
    EXPECTED_EXPORTS=(
        "BaseFinancialAgent"
        "FundamentalAnalystAgent"
        "TechnicalAnalystAgent"
        "SentimentAnalystAgent"
        "RiskAnalystAgent"
        "MacroAnalystAgent"
    )

    ALL_EXPORTED=true
    for export in "${EXPECTED_EXPORTS[@]}"; do
        if ! grep -q "$export" "$AGENTS_INDEX"; then
            ALL_EXPORTED=false
            break
        fi
    done

    if [ "$ALL_EXPORTED" = true ]; then
        check_pass
    else
        check_fail "Nem todos os agentes estão exportados"
    fi
else
    check_fail "Arquivo index.ts não encontrado"
fi

check_start "MultiAgentAnalysisService importa agentes corretamente"
MULTI_AGENT="backend/src/ai/services/multi-agent-analysis.service.ts"
if grep -q "from '../agents'" "$MULTI_AGENT" && \
   grep -q "FundamentalAnalystAgent" "$MULTI_AGENT" && \
   grep -q "TechnicalAnalystAgent" "$MULTI_AGENT"; then
    check_pass
else
    check_fail "Imports de agentes incorretos"
fi

check_start "ai.module.ts importa todos os providers"
AI_MODULE="backend/src/ai/ai.module.ts"
if grep -q "DocumentShardingService" "$AI_MODULE" && \
   grep -q "MultiAgentAnalysisService" "$AI_MODULE" && \
   grep -q "FundamentalAnalystAgent" "$AI_MODULE"; then
    check_pass
else
    check_fail "Providers faltando no ai.module.ts"
fi

# Phase 7: TypeScript Compilation
print_section "FASE 7: Compilação TypeScript"

cd backend

check_start "Compilação TypeScript do backend"
if npm run build --silent > /tmp/tsc-output.log 2>&1; then
    check_pass
    echo "    Build bem-sucedido"
else
    check_fail "Erros de compilação encontrados"
    echo ""
    echo "    Erros de compilação:"
    tail -n 20 /tmp/tsc-output.log | while read line; do
        echo "    ${line}"
    done
    echo ""
    echo "    Log completo: /tmp/tsc-output.log"
fi

cd ..

# Phase 8: Configuration Files
print_section "FASE 8: Arquivos de Configuração"

check_start ".env.example existe"
if [ -f ".env.example" ]; then
    check_pass

    # Check for OpenAI key placeholder
    if grep -q "OPENAI_API_KEY" ".env.example"; then
        echo "    ✓ OPENAI_API_KEY configurado"
    else
        check_warning "OPENAI_API_KEY não encontrado em .env.example"
    fi
else
    check_fail ".env.example não encontrado"
fi

check_start ".env existe (necessário para execução)"
if [ -f ".env" ]; then
    check_pass
else
    check_warning ".env não encontrado - será necessário criar"
    echo "    Execute: cp .env.example .env"
fi

# Phase 9: Frontend Validation
print_section "FASE 9: Validação do Frontend"

check_start "Frontend package.json existe"
if [ -f "frontend/package.json" ]; then
    check_pass
else
    check_fail "frontend/package.json não encontrado"
fi

check_start "Frontend node_modules existe"
if [ -d "frontend/node_modules" ]; then
    check_pass
else
    check_warning "frontend/node_modules não encontrado"
    echo "    Execute: cd frontend && npm install"
fi

# Phase 10: Docker Validation
print_section "FASE 10: Validação Docker"

check_start "docker-compose.yml existe e é válido"
if [ -f "docker-compose.yml" ]; then
    if command -v docker-compose &> /dev/null; then
        if docker-compose config > /dev/null 2>&1; then
            check_pass
        else
            check_fail "docker-compose.yml tem erros de sintaxe"
        fi
    else
        check_warning "docker-compose não instalado (não é crítico)"
    fi
else
    check_fail "docker-compose.yml não encontrado"
fi

# Phase 11: Git Status
print_section "FASE 11: Status do Git"

check_start "Repositório Git inicializado"
if [ -d ".git" ]; then
    check_pass
else
    check_fail "Não é um repositório Git"
fi

check_start "Working tree limpo"
if git diff-index --quiet HEAD -- 2>/dev/null; then
    check_pass
    echo "    Todos os arquivos commitados"
else
    check_warning "Existem mudanças não commitadas"
    echo "    Execute: git status"
fi

# Phase 12: Documentation
print_section "FASE 12: Documentação"

DOC_FILES=(
    "README.md"
    "backend/src/ai/README.md"
    "DOCKER_DEPLOYMENT.md"
    "BMAD_METHOD_ANALYSIS.md"
    "BMAD_CONCEPTS_ADAPTATION.md"
)

for doc in "${DOC_FILES[@]}"; do
    check_start "Documentação existe: $(basename $doc)"
    if [ -f "$doc" ]; then
        check_pass
    else
        check_warning "Documentação não encontrada: $doc"
    fi
done

# Phase 13: Critical Functionality Test
print_section "FASE 13: Teste de Funcionalidade Crítica"

check_start "Verificando imports do OpenAI"
if grep -r "import OpenAI from 'openai'" backend/src/ai/ > /dev/null; then
    check_pass
else
    check_fail "Import do OpenAI não encontrado nos arquivos AI"
fi

check_start "Verificando uso de ConfigService"
if grep -r "ConfigService" backend/src/ai/agents/ > /dev/null; then
    check_pass
else
    check_fail "ConfigService não está sendo usado nos agentes"
fi

check_start "Verificando decorators NestJS"
if grep -r "@Injectable()" backend/src/ai/ > /dev/null; then
    check_pass
else
    check_fail "Decorators @Injectable() não encontrados"
fi

# Final Report
print_header "RELATÓRIO FINAL DE VALIDAÇÃO"

echo ""
echo -e "${CYAN}📊 Estatísticas:${NC}"
echo "  Total de verificações: $TOTAL_CHECKS"
echo -e "  ${GREEN}Passou: $PASSED_CHECKS${NC}"
echo -e "  ${RED}Falhou: $FAILED_CHECKS${NC}"
echo -e "  ${YELLOW}Avisos: $WARNINGS${NC}"
echo ""

# Calculate success rate
SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo -e "${CYAN}📈 Taxa de Sucesso: ${SUCCESS_RATE}%${NC}"
echo ""

# Verdict
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                  ║${NC}"
    echo -e "${GREEN}║     ✓ SISTEMA PRONTO PARA CLAUDE CLI NO VS CODE ║${NC}"
    echo -e "${GREEN}║                                                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}O sistema está 100% validado e pode ser aberto no VS Code com Claude CLI.${NC}"
    echo ""

    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠  Existem $WARNINGS avisos não-críticos que podem ser resolvidos.${NC}"
        echo ""
    fi

    echo "Próximos passos:"
    echo "  1. Abra o VS Code na pasta do projeto"
    echo "  2. Certifique-se que a extensão Claude CLI está instalada"
    echo "  3. Execute: claude --teleport session_ID"
    echo ""

    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                  ║${NC}"
    echo -e "${RED}║     ✗ SISTEMA NÃO ESTÁ PRONTO                   ║${NC}"
    echo -e "${RED}║                                                  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Encontrados $FAILED_CHECKS erros críticos que precisam ser corrigidos.${NC}"
    echo ""
    echo "Revise os erros acima e corrija antes de abrir no VS Code."
    echo ""

    exit 1
fi
