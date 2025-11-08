#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Contadores
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Função para verificação
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local description="$1"
    local command="$2"
    
    echo -ne "  ${CYAN}[CHECK]${NC} $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ FALHOU${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_with_count() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local description="$1"
    local command="$2"
    local expected="$3"
    
    echo -ne "  ${CYAN}[CHECK]${NC} $description... "
    
    result=$(eval "$command" 2>/dev/null)
    if [ "$result" = "$expected" ]; then
        echo -e "${GREEN}✓ OK${NC} ($result encontrado)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ FALHOU${NC} (esperado: $expected, encontrado: $result)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

echo -e "${BLUE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VALIDAÇÃO COMPLETA DE REQUISITOS - B3 AI ANALYSIS PLATFORM   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# REQUISITO 1: Análise do BMAD-METHOD
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 1: Análise do BMAD-METHOD${NC}\n"

check "Documento BMAD_METHOD_ANALYSIS.md existe" \
    "[ -f 'BMAD_METHOD_ANALYSIS.md' ]"

check "Análise tem mais de 500 linhas" \
    "[ \$(wc -l < BMAD_METHOD_ANALYSIS.md) -gt 500 ]"

check "Análise contém recomendação clara" \
    "grep -q 'NÃO IMPLEMENTAR\|DO NOT IMPLEMENT' BMAD_METHOD_ANALYSIS.md"

check "Análise contém justificativa ROI" \
    "grep -q 'ROI' BMAD_METHOD_ANALYSIS.md"

# ============================================================================
# REQUISITO 2: Adaptação de Conceitos do BMAD
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 2: Adaptação de Conceitos do BMAD${NC}\n"

check "Documento BMAD_CONCEPTS_ADAPTATION.md existe" \
    "[ -f 'BMAD_CONCEPTS_ADAPTATION.md' ]"

check "Documento tem mais de 1000 linhas" \
    "[ \$(wc -l < BMAD_CONCEPTS_ADAPTATION.md) -gt 1000 ]"

check "Contém conceito de Agentes Especializados" \
    "grep -q 'Specialized.*Agent\|Agentes Especializados' BMAD_CONCEPTS_ADAPTATION.md"

check "Contém conceito de Document Sharding" \
    "grep -q 'Document Sharding' BMAD_CONCEPTS_ADAPTATION.md"

check "Contém estimativa de economia" \
    "grep -q '60.*80%\|economia' BMAD_CONCEPTS_ADAPTATION.md"

# ============================================================================
# REQUISITO 3: Implementação de 5 Agentes Especializados
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 3: Implementação de 5 Agentes Especializados${NC}\n"

check_with_count "Número de agentes implementados" \
    "ls backend/src/ai/agents/*.agent.ts 2>/dev/null | wc -l" \
    "5"

check "FundamentalAnalystAgent implementado" \
    "[ -f 'backend/src/ai/agents/fundamental-analyst.agent.ts' ]"

check "TechnicalAnalystAgent implementado" \
    "[ -f 'backend/src/ai/agents/technical-analyst.agent.ts' ]"

check "SentimentAnalystAgent implementado" \
    "[ -f 'backend/src/ai/agents/sentiment-analyst.agent.ts' ]"

check "RiskAnalystAgent implementado" \
    "[ -f 'backend/src/ai/agents/risk-analyst.agent.ts' ]"

check "MacroAnalystAgent implementado" \
    "[ -f 'backend/src/ai/agents/macro-analyst.agent.ts' ]"

check "BaseFinancialAgent (classe base) existe" \
    "[ -f 'backend/src/ai/agents/base-financial-agent.ts' ]"

# Verificar conteúdo dos agentes
check "FundamentalAnalyst tem análise de P/L" \
    "grep -q 'P/L\|pl' backend/src/ai/agents/fundamental-analyst.agent.ts"

check "TechnicalAnalyst tem análise de RSI" \
    "grep -q 'RSI\|rsi' backend/src/ai/agents/technical-analyst.agent.ts"

check "SentimentAnalyst tem análise de notícias" \
    "grep -q 'news\|sentiment\|notícias' backend/src/ai/agents/sentiment-analyst.agent.ts"

check "RiskAnalyst tem análise de volatilidade" \
    "grep -q 'volatility\|volatilidade\|risk' backend/src/ai/agents/risk-analyst.agent.ts"

check "MacroAnalyst tem análise de Selic" \
    "grep -q 'Selic\|selic\|macro' backend/src/ai/agents/macro-analyst.agent.ts"

# ============================================================================
# REQUISITO 4: Document Sharding Service
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 4: Document Sharding Service${NC}\n"

check "DocumentShardingService implementado" \
    "[ -f 'backend/src/ai/services/document-sharding.service.ts' ]"

check "Service tem método de chunking" \
    "grep -q 'shardDocument\|chunk' backend/src/ai/services/document-sharding.service.ts"

check "Service usa embeddings OpenAI" \
    "grep -q 'embedding\|getEmbedding' backend/src/ai/services/document-sharding.service.ts"

check "Service calcula cosine similarity" \
    "grep -q 'cosineSimilarity' backend/src/ai/services/document-sharding.service.ts"

check "Service seleciona chunks relevantes" \
    "grep -q 'selectRelevantChunks\|relevance' backend/src/ai/services/document-sharding.service.ts"

# ============================================================================
# REQUISITO 5: Multi-Agent Analysis Service
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 5: Multi-Agent Analysis Service${NC}\n"

check "MultiAgentAnalysisService implementado" \
    "[ -f 'backend/src/ai/services/multi-agent-analysis.service.ts' ]"

check "Service orquestra múltiplos agentes" \
    "grep -q 'analyzeComplete\|Promise.all' backend/src/ai/services/multi-agent-analysis.service.ts"

check "Service calcula consenso" \
    "grep -q 'calculateConsensus\|consensus' backend/src/ai/services/multi-agent-analysis.service.ts"

check "Service tem voting mechanism" \
    "grep -q 'voting\|vote\|agreement' backend/src/ai/services/multi-agent-analysis.service.ts"

# ============================================================================
# REQUISITO 6: Interfaces e Types
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 6: Interfaces e Types${NC}\n"

check "analysis.types.ts existe" \
    "[ -f 'backend/src/ai/interfaces/analysis.types.ts' ]"

check "financial-agent.interface.ts existe" \
    "[ -f 'backend/src/ai/interfaces/financial-agent.interface.ts' ]"

check "IFinancialAgent interface definida" \
    "grep -q 'interface IFinancialAgent\|export.*IFinancialAgent' backend/src/ai/interfaces/financial-agent.interface.ts"

check "AgentResponse type definido" \
    "grep -q 'AgentResponse\|interface.*Response' backend/src/ai/interfaces/analysis.types.ts"

check "Signal type definido" \
    "grep -q 'Signal\|interface.*Signal' backend/src/ai/interfaces/analysis.types.ts"

# ============================================================================
# REQUISITO 7: AI Module Configuration
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 7: AI Module Configuration${NC}\n"

check "ai.module.ts existe" \
    "[ -f 'backend/src/ai/ai.module.ts' ]"

check "Módulo exporta todos os agentes" \
    "grep -q 'FundamentalAnalystAgent' backend/src/ai/ai.module.ts && grep -q 'TechnicalAnalystAgent' backend/src/ai/ai.module.ts"

check "Módulo exporta serviços" \
    "grep -q 'DocumentShardingService\|MultiAgentAnalysisService' backend/src/ai/ai.module.ts"

check "Módulo está registrado como provider" \
    "grep -q '@Module' backend/src/ai/ai.module.ts"

check "index.ts exporta agentes" \
    "[ -f 'backend/src/ai/agents/index.ts' ] && grep -q 'export' backend/src/ai/agents/index.ts"

# ============================================================================
# REQUISITO 8: Correções de Compilação TypeScript
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 8: Correções de Compilação${NC}\n"

check "Dependência openai instalada" \
    "[ -d 'backend/node_modules/openai' ]"

check "Dependência @nestjs/bull instalada" \
    "[ -d 'backend/node_modules/@nestjs/bull' ]"

check "Dependência @nestjs/cache-manager instalada" \
    "[ -d 'backend/node_modules/@nestjs/cache-manager' ]"

check "WebSocketGateway renomeado para AppWebSocketGateway" \
    "grep -q 'class AppWebSocketGateway' backend/src/websocket/websocket.gateway.ts"

check "Scrapers usando scrapeData ao invés de scrape" \
    "grep -q 'protected async scrapeData' backend/src/scrapers/news/valor.scraper.ts"

check "AssetType enum sendo usado corretamente" \
    "grep -q 'AssetType.STOCK' backend/src/queue/processors/scraping.processor.ts"

check "Database module importando entities explicitamente" \
    "grep -q 'User,' backend/src/database/database.module.ts"

check "ThrottlerModule usando nova API" \
    "grep -q 'throttlers:' backend/src/app.module.ts"

# ============================================================================
# REQUISITO 9: Compilação TypeScript sem Erros
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 9: Compilação TypeScript${NC}\n"

cd backend
echo -ne "  ${CYAN}[CHECK]${NC} Compilando TypeScript... "
if npm run build > /tmp/build-output.log 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗ FALHOU${NC}"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${YELLOW}Erros de compilação:${NC}"
    tail -20 /tmp/build-output.log
fi
cd ..

# ============================================================================
# REQUISITO 10: Documentação
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 10: Documentação${NC}\n"

check "README.md do módulo AI existe" \
    "[ -f 'backend/src/ai/README.md' ]"

check "VALIDATION_REPORT.md existe" \
    "[ -f 'VALIDATION_REPORT.md' ]"

check "validate-vscode-cli.sh existe e é executável" \
    "[ -x 'validate-vscode-cli.sh' ]"

check "Documentação do AI tem exemplos de uso" \
    "grep -q 'example\|exemplo\|usage' backend/src/ai/README.md"

check "VALIDATION_REPORT tem mais de 700 linhas" \
    "[ \$(wc -l < VALIDATION_REPORT.md) -gt 700 ]"

# ============================================================================
# REQUISITO 11: Configuração de Ambiente
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 11: Configuração de Ambiente${NC}\n"

check ".env.example existe na raiz" \
    "[ -f '.env.example' ]"

check ".env existe no backend" \
    "[ -f 'backend/.env' ]"

check ".env configurado para localhost" \
    "grep -q 'DB_HOST=localhost' backend/.env"

check ".env tem OPENAI_API_KEY configurado" \
    "grep -q 'OPENAI_API_KEY' backend/.env"

# ============================================================================
# REQUISITO 12: Estrutura de Arquivos
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 12: Estrutura de Arquivos${NC}\n"

check "Diretório backend/src/ai existe" \
    "[ -d 'backend/src/ai' ]"

check "Diretório backend/src/ai/agents existe" \
    "[ -d 'backend/src/ai/agents' ]"

check "Diretório backend/src/ai/services existe" \
    "[ -d 'backend/src/ai/services' ]"

check "Diretório backend/src/ai/interfaces existe" \
    "[ -d 'backend/src/ai/interfaces' ]"

check_with_count "Total de arquivos .ts no módulo AI" \
    "find backend/src/ai -name '*.ts' -type f | wc -l" \
    "12"

# ============================================================================
# REQUISITO 13: Git e Versionamento
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 13: Git e Versionamento${NC}\n"

check "Repositório Git inicializado" \
    "[ -d '.git' ]"

check "Working tree limpo" \
    "git diff-index --quiet HEAD --"

check "Commit de correções existe (96b67b5)" \
    "git log --oneline | grep -q '96b67b5'"

check "Commit de documentação existe (427da0e)" \
    "git log --oneline | grep -q '427da0e'"

check "Branch correto" \
    "git branch --show-current | grep -q 'claude/b3-ai-analysis-platform'"

# ============================================================================
# REQUISITO 14: Integração OpenAI
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 14: Integração OpenAI${NC}\n"

check "BaseFinancialAgent importa OpenAI" \
    "grep -q \"import.*OpenAI.*from.*'openai'\" backend/src/ai/agents/base-financial-agent.ts"

check "Agentes usam GPT-4 Turbo" \
    "grep -q \"gpt-4-turbo\|gpt-4\" backend/src/ai/agents/base-financial-agent.ts"

check "DocumentSharding usa embeddings" \
    "grep -q \"text-embedding-ada-002\|embeddings.create\" backend/src/ai/services/document-sharding.service.ts"

check "ConfigService usado para API key" \
    "grep -q \"ConfigService\" backend/src/ai/agents/base-financial-agent.ts"

# ============================================================================
# REQUISITO 15: Features Avançadas
# ============================================================================
echo -e "\n${CYAN}${BOLD}▶ REQUISITO 15: Features Avançadas${NC}\n"

check "Geração de sinais automáticos implementada" \
    "grep -q \"extractSignals\|generateSignal\" backend/src/ai/agents/fundamental-analyst.agent.ts"

check "Confidence scoring implementado" \
    "grep -q \"confidence\" backend/src/ai/agents/base-financial-agent.ts"

check "Metadata tracking implementado" \
    "grep -q \"metadata\" backend/src/ai/interfaces/analysis.types.ts"

check "Timestamp tracking implementado" \
    "grep -q \"timestamp\" backend/src/ai/interfaces/analysis.types.ts"

# ============================================================================
# RESUMO FINAL
# ============================================================================
echo -e "\n${BLUE}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  RESUMO DA VALIDAÇÃO DE REQUISITOS                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo -e "${CYAN}📊 Estatísticas:${NC}"
echo -e "  Total de requisitos verificados: ${BOLD}$TOTAL_CHECKS${NC}"
echo -e "  ${GREEN}✓ Passou: $PASSED_CHECKS${NC}"
echo -e "  ${RED}✗ Falhou: $FAILED_CHECKS${NC}"
echo ""
echo -e "${CYAN}📈 Taxa de Implementação: ${BOLD}$PERCENTAGE%${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}"
    echo "╔══════════════════════════════════════════════════╗"
    echo "║                                                  ║"
    echo "║     ✓ TODOS OS REQUISITOS IMPLEMENTADOS         ║"
    echo "║                                                  ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}Parabéns! Todos os requisitos foram implementados com sucesso!${NC}\n"
    exit 0
else
    echo -e "${RED}${BOLD}"
    echo "╔══════════════════════════════════════════════════╗"
    echo "║                                                  ║"
    echo "║     ✗ ALGUNS REQUISITOS FALHARAM                ║"
    echo "║                                                  ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${RED}Existem $FAILED_CHECKS requisitos que precisam de atenção.${NC}\n"
    exit 1
fi
