#!/usr/bin/env node
/**
 * Checklist Auto-Trigger v5.2
 *
 * Detecta keywords BILINGUES (PT + EN) no prompt do usuario e injeta instrucoes
 * para usar skills e secoes do checklist automaticamente.
 *
 * Baseado em: Best practices da comunidade Claude Code
 * Referencia: CHECKLIST_ECOSSISTEMA_COMPLETO.md (22 secoes)
 *
 * v5.2 (2025-12-16):
 * - NEW: Priority/Weight system for intelligent trigger ordering
 * - NEW: Conflict detection between categories
 * - NEW: Supersedes hierarchy to handle overlaps
 * - NEW: Integration with tag-analytics for metrics
 * - NEW: Smart limit by priority (not arbitrary 4)
 * - 69 categorias de keywords (100% cobertura CHECKLIST)
 * - ~1100 keywords bilingues (PT + EN)
 *
 * v5.0 (2025-12-15):
 * - 65 categorias de keywords (100% cobertura CHECKLIST)
 * - ~1100 keywords bilingues (PT + EN)
 * - 22/22 secoes cobertas
 * - Novas categorias domain-specific:
 *   technicalIndicators, fundamentalMetrics, macro, corporateActions,
 *   wheelStrategy, sentiment, riskManagement, marketIndices, dataSources,
 *   cicd, dataQuality
 * - Keywords EN expandidas em categorias existentes
 *
 * v4.0 (2025-12-15):
 * - 51 categorias de keywords (expandido de 34)
 * - Fix regex: .? -> \s? para evitar falsos positivos
 * - Novas categorias: migration, validation, routing, hook, middleware,
 *   transaction, index, cache, crossvalidation, dividend, options,
 *   health, network, backup, retry, ratelimit, circuit
 * - Keywords financeiras expandidas (spread, bid, ask, volume, taxa)
 * - Formas femininas PT adicionadas
 * - Overlaps corrigidos (agent removido de performance)
 *
 * v3.0 (2025-12-15):
 * - 34 categorias de keywords (expandido de 24)
 * - Suporte bilingue completo (PT + EN)
 * - Novas categorias v3.0: webResearch, postImplementation, regression,
 *   docSync, testCoverage, deployment, ecosystem, agentHelp, improvement, urgency
 *
 * v2.0 (2025-12-15):
 * - 24 categorias de keywords (expandido de 14)
 * - Novas categorias: planning, codeReview, ux, forms, visual, charts,
 *   quality, observability, jobs, websocket, documentation, mcp, environment
 */

// Priority order for sorting (higher = more important)
const PRIORITY_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

// Maximum triggers by priority level
const MAX_TRIGGERS_BY_PRIORITY = {
  critical: 10,  // Always show critical
  high: 4,
  medium: 2,
  low: 1
};

// Import analytics if available
let analytics;
try {
  analytics = require('./tag-analytics');
} catch (e) {
  analytics = null;
}

const KEYWORD_MAPPINGS = {
  // =============================================================
  // PLANNING & PM TRIGGERS (PT + EN)
  // =============================================================
  planning: {
    patterns: /\b(planejamento|planejamentos|planejado|planejada|planning|plano|plan|pm|product[\s\-]?manager|levantamento|survey|robusto|robust|detalhado|detailed|minucioso|thorough|profundo|deep|ultra|blueprint|estrategia|strategy|strategic|framework|cronograma|visao|mapa)\b/i,
    skills: ['context-check'],
    sections: ['1-2 (Context Loading)', 'IMPLEMENTATION_PLAN.md'],
    message: 'Use Ultra-Thinking + Sequential Thinking MCP. Leia IMPLEMENTATION_PLAN.md para template de fases.',
    priority: 'high',
    weight: 8,
    supersedes: ['documentation']
  },

  // =============================================================
  // DEVELOPMENT TRIGGERS (PT + EN)
  // =============================================================
  development: {
    patterns: /\b(implement|implementar|implementada|implementado|criar|criada|criado|create|desenvolver|desenvolvida|desenvolvido|desenvolvimento|develop|feature|funcionalidade|adicionar|add|novo|nova|new|build|construir|construida|construido|codificar|code|coding|artefato|artifact|feita|feito)\b/i,
    skills: ['context-check'],
    sections: ['1-2 (Context Loading)', '3 (Development Patterns)'],
    message: 'Carregue contexto (skill context-check) e siga padroes da secao 3 do CHECKLIST_ECOSSISTEMA_COMPLETO.md',
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // CODE REVIEW & QUALITY TRIGGERS (PT + EN)
  // =============================================================
  codeReview: {
    patterns: /\b(code[\s\-]?review|revisar|revisada|revisado|review|revisao|melhores[\s\-]?praticas|best[\s\-]?practices|padrao|pattern|padroes|patterns|qualidade|quality|analise|analisar|standards|padronizacao|static[\s\-]?analysis|linting|lint)\b/i,
    skills: [],
    sections: ['3 (Patterns)', '4 (Pre-Commit)', 'CHECKLIST_CODE_REVIEW_COMPLETO.md'],
    message: 'Siga CHECKLIST_CODE_REVIEW_COMPLETO.md. Aplique melhores praticas antes de commit.',
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // COMMIT & GIT TRIGGERS (PT + EN)
  // =============================================================
  commit: {
    patterns: /\b(commit|commits|commitar|push|pushar|merge|mergear|pr|pull[\s\-]?request|git|versionamento|versioning|branch|atualizada|atualizado|updated|rebase|cherry[\s\-]?pick|stash)\b/i,
    skills: ['zero-tolerance'],
    sections: ['4-5 (Pre-Commit + Commit)'],
    message: 'Execute Zero Tolerance (skill zero-tolerance) antes do commit. Secoes 4-5 do checklist.',
    priority: 'high',
    weight: 9
  },

  // =============================================================
  // PHASE & VALIDATION TRIGGERS (PT + EN)
  // =============================================================
  phase: {
    patterns: /\b(fase|fases|phase|etapa|etapas|step|validar|validada|validado|validate|validacao|validation|check[\s\-]?ecosystem|verificar|verificada|verificado|verify|proxima|proximo|next|continuar|continue|checkpoint|milestone|sprint|iteracao)\b/i,
    skills: ['check-ecosystem', 'mcp-triplo'],
    sections: ['6-21 (Full Ecosystem)'],
    message: 'Execute /check-ecosystem para validacao 100% do ecossistema. Fase anterior deve estar 100%.',
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // SCRAPER & DATA COLLECTION TRIGGERS (PT + EN)
  // =============================================================
  scraper: {
    patterns: /\b(scraper|scrapers|scraping|raspagem|raspar|playwright|beautifulsoup|selenium|coletar|collect|extrair|extract|crawl|crawler|fontes|sources|dados.?reais|real.?data)\b/i,
    skills: [],
    sections: ['18 (Scrapers Inventory)', 'PLAYWRIGHT_SCRAPER_PATTERN.md'],
    message: 'Consulte secao 18 - Padrao BeautifulSoup obrigatorio. 35 scrapers documentados.',
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // FRONTEND & UI TRIGGERS (PT + EN)
  // =============================================================
  frontend: {
    patterns: /\b(frontend|front[\s\-]?end|componente|componentes|component|components|react|next\.?js|shadcn|tailwind|pagina|paginas|page|pages|tela|telas|screen|ui|interface|web|browser|navegador|gui)\b/i,
    skills: [],
    sections: ['3.2 (Frontend Patterns)', '8.1 (18 Pages)'],
    message: 'Siga padroes frontend da secao 3.2. Verifique lista de 18 paginas na secao 8.1.',
    priority: 'high',
    weight: 7,
    conflicts: ['backend']
  },

  // =============================================================
  // UX & USABILITY TRIGGERS (PT + EN)
  // =============================================================
  ux: {
    patterns: /\b(ux|usabilidade|usability|ergonomia|ergonomics|acessibilidade|accessibility|wcag|a11y|interacao|interaction|emulacao|emulation|responsivo|responsive)\b/i,
    skills: [],
    sections: ['6 (Post-Implementation)', 'MCP a11y'],
    message: 'Use MCP a11y para validar acessibilidade. WCAG 2.1 AA obrigatorio.',
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // FORM & INPUT TRIGGERS (PT + EN)
  // =============================================================
  forms: {
    patterns: /\b(formulario|formularios|form|forms|textbox|checkbox|input|inputs|campo|campos|field|fields|dropdown|select|botao|botoes|button|buttons|label|labels|aba|abas|tab|tabs)\b/i,
    skills: [],
    sections: ['3.2 (Frontend Patterns)', '8.1 (18 Pages)'],
    message: 'Valide formularios com MCP Triplo. Teste todos os inputs e validacoes.',
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // VISUAL & LAYOUT TRIGGERS (PT + EN)
  // =============================================================
  visual: {
    patterns: /\b(layout|style|estilo|formatacao|formatting|imagem|imagens|image|images|fonte|fontes|font|fonts|dimensionamento|sizing|scroll|carregamento|loading|inicializacao|initialization)\b/i,
    skills: [],
    sections: ['3.2 (Frontend Patterns)', 'MCP Chrome DevTools'],
    message: 'Use Chrome DevTools MCP para validar visual. Capture screenshots de evidencia.',
    priority: 'low',
    weight: 4
  },

  // =============================================================
  // DATA VISUALIZATION TRIGGERS (PT + EN)
  // =============================================================
  charts: {
    patterns: /\b(grafico|graficos|chart|charts|tabela|tabelas|table|tables|lista|listas|list|lists|ordenacao|sorting|paginacao|pagination|candlestick|macd|rsi)\b/i,
    skills: [],
    sections: ['8.1 (18 Pages)', '3.2 (Frontend Patterns)'],
    message: 'Valide graficos e tabelas. Use Recharts para dashboard, lightweight-charts para candlestick.',
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // BACKEND TRIGGERS (PT + EN)
  // =============================================================
  backend: {
    patterns: /\b(backend|back.?end|controller|controlador|service|servico|nestjs|nest|endpoint|rota|route|api.?rest|dto|procedure|procedures|funcao|funcoes|function|functions|handler|handlers|repository|repositories|resolver|resolvers|mapper|mappers|adapter|adapters|provider|providers|module|modules|decorator|decorators|injectable)\b/i,
    skills: [],
    sections: ['3.1 (Backend Patterns)', '8.2 (11 Controllers)'],
    message: 'Siga padroes backend da secao 3.1. Verifique lista de 11 controllers na secao 8.2.',
    priority: 'high',
    weight: 7,
    conflicts: ['frontend']
  },

  // =============================================================
  // DATABASE TRIGGERS (PT + EN)
  // =============================================================
  database: {
    patterns: /\b(database|db|banco[\s\-]?de[\s\-]?dados|entity|entidade|entidades|entities|typeorm|postgresql|postgres|schema|esquema|tabela|tabelas|table|tables|query|queries|consulta|consultas|sql|indices|relacionamento|relationship|constraint|views?|triggers?)\b/i,
    skills: ['create-migration'],
    sections: ['17 (Database Inventory)', 'DATABASE_SCHEMA.md'],
    message: 'Consulte secao 17 - 26 entidades documentadas. Leia DATABASE_SCHEMA.md.',
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // FINANCIAL DATA TRIGGERS (PT + EN)
  // =============================================================
  financial: {
    patterns: /\b(financeiro|financeira|financial|decimal|preco|precos|price|prices|selic|ipca|cdi|acao|acoes|stock|stocks|ativo|ativos|asset|assets|cotacao|cotacoes|quote|quotes|dividendo|dividendos|dividend|dividends|bolsa|exchange|b3|dinheiro|money|valor|valores|value|mercado|market|precisao|precision|arredondamento|rounding|spread|bid|ask|volume|taxa|taxas|juros|lote|fechamento|abertura|closing|opening|ohlcv|ohlc|settlement|margin|leverage|forex|FX|trading|trader|position|portfolio|holding|holdings|equity|liquidity|order|orders|ticker|tickers)\b/i,
    skills: ['cross-validation'],
    sections: ['3.1 (Financial Data Rules)', '.gemini/context/financial-rules.md'],
    message: 'Use Decimal.js (NUNCA Float). Cross-validation minimo 3 fontes. Precisao absoluta obrigatoria.',
    priority: 'critical',
    weight: 10
  },

  // =============================================================
  // TROUBLESHOOTING TRIGGERS (PT + EN)
  // =============================================================
  troubleshoot: {
    patterns: /\b(troubleshoot|troubleshooting|debug|debugging|depurar|erro|erros|error|errors|problema|problemas|problem|problems|fix|fixar|fixada|fixado|bug|bugs|issue|issues|corrigir|corrigida|corrigido|correct|investigar|investigate|resolver|resolvida|resolvido|resolve|solucionar|root[\s\-]?cause|causa[\s\-]?raiz|rca)\b/i,
    skills: [],
    sections: ['7 (Troubleshooting)', 'KNOWN-ISSUES.md'],
    message: 'Consulte secao 7 (Quick Reference) e KNOWN-ISSUES.md. Identifique root cause, nao sintoma.',
    priority: 'critical',
    weight: 10
  },

  // =============================================================
  // QUALITY & ISSUES TRIGGERS (PT + EN)
  // =============================================================
  quality: {
    patterns: /\b(gap|gaps|alarme|alarmes|alarm|alarms|warning|warnings|aviso|avisos|excessao|excessoes|exception|exceptions|falha|falhas|failure|failures|divergencia|divergencias|divergence|inconsistencia|inconsistencias|inconsistency|nao[\s\-]?bloqueante|non[\s\-]?blocking|melhoria|melhorada|melhorado|improvement|workaround|verificada|verificado|qa|quality[\s\-]?assurance)\b/i,
    skills: [],
    sections: ['7 (Troubleshooting)', '12 (Validacoes Faltantes)'],
    message: 'Documente em KNOWN-ISSUES.md. NUNCA fazer workaround - corrija root cause.',
    priority: 'critical',
    weight: 9
  },

  // =============================================================
  // SECURITY TRIGGERS (PT + EN)
  // =============================================================
  security: {
    patterns: /\b(security|seguranca|auth|autenticacao|authentication|oauth|jwt|vulnerab|vulnerability|vulnerabilities|cors|token|tokens|senha|senhas|password|passwords|permissao|permissoes|permission|permissions|acesso|access|credencial|credential|credentials|criptografia|encryption|xss|sqli|sql[\s\-]?injection|csrf|ssl|tls|https)\b/i,
    skills: [],
    sections: ['16 (Security Inventory)'],
    message: 'Consulte secao 16 - 6 vulnerabilidades CRITICAS documentadas.',
    priority: 'critical',
    weight: 10
  },

  // =============================================================
  // DOCKER & INFRA TRIGGERS (PT + EN)
  // =============================================================
  docker: {
    patterns: /\b(docker|dockerfile|container|containers|containerization|infra|infraestrutura|infrastructure|volume|volumes|compose|docker[\s\-]?compose|restart|reiniciar|implantacao|porta|portas|port|ports|system[\s\-]?manager|image|imagem|exec|logs)\b/i,
    skills: [],
    sections: ['19 (Docker Inventory)', '8.3 (Containers)'],
    message: 'Use system-manager.ps1 para gerenciar. 21 servicos documentados na secao 19.',
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // API & INTEGRATION TRIGGERS (PT + EN)
  // =============================================================
  api: {
    patterns: /\b(api|apis|brapi|fundamentus|statusinvest|bcb|externa|external|integracao|integracoes|integration|integrations|endpoint|endpoints|requisicao|requisicoes|request|requests|resposta|respostas|response|responses|http|rest|restful|dependencia|dependencias|dependency|dependencies|graphql|webhook|webhooks|rate[\s\-]?limit|api[\s\-]?key|timeout|gateway|SDK|consumption|error[\s\-]?handling|client|clients|axios|fetch|swagger|openapi|postman|curl)\b/i,
    skills: [],
    sections: ['20 (APIs Externas)', '11.3 (APIs)'],
    message: 'Consulte secao 20 - 34+ APIs documentadas. Cross-validation obrigatorio.',
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // TESTING TRIGGERS (PT + EN)
  // =============================================================
  testing: {
    patterns: /\b(test|teste|testes|tests|testing|testando|testar|testada|testado|unit|unitario|unitaria|e2e|end[\s\-]?to[\s\-]?end|jest|playwright|spec|specs|coverage|cobertura|mock|mocking|cenario|cenarios|scenario|scenarios|massivo|massivos|massive|qa|acceptance|integration[\s\-]?test)\b/i,
    skills: [],
    sections: ['13 (Test Gaps)', '6 (Post-Implementation)'],
    message: 'Consulte secao 13 - Gaps de testes. Criar multiplos cenarios de teste.',
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // PERFORMANCE TRIGGERS (PT + EN)
  // =============================================================
  performance: {
    patterns: /\b(performance|desempenho|lento|lenta|slow|otimizar|otimizada|otimizado|optimize|optimized|otimizacao|optimization|caches|caching|n\+1|memoria|memory|cpu|latencia|latency|capacidade|capacity|paralelo|parallel|throughput|escalabilidade|scalability|bottleneck|gargalo|profiling|benchmark|APM|tuning|metrics|baseline|load[\s\-]?test|stress[\s\-]?test|response[\s\-]?time|concurrency|async|await|promise|pooling)\b/i,
    skills: [],
    sections: ['15 (Data Flows)', '3 (Patterns)'],
    message: 'Evite N+1 queries. Use batch loading + Maps. Processos paralelos quando possivel.',
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // OBSERVABILITY TRIGGERS (PT + EN)
  // =============================================================
  observability: {
    patterns: /\b(log|logs|logging|trace|traces|tracing|rastreabilidade|traceability|monitoracao|monitoring|auditoria|auditing|audit|metricas|metrics|debug|depurar|habilitar|enable|telemetry|telemetria|alerting|alertas|dashboard|dashboards|SLO|SLI|SLA|prometheus|grafana|loki|tempo|jaeger|opentelemetry|apm|datadog|newrelic)\b/i,
    skills: [],
    sections: ['10 (Observability)', '5 (CLAUDE.md Observability)'],
    message: 'Mantenha logs habilitados. Use Logger NestJS (backend) e Loguru (Python).',
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // SYNC & JOBS TRIGGERS (PT + EN)
  // =============================================================
  jobs: {
    patterns: /\b(job|jobs|queue|fila|bullmq|agendamento|agendamentos|scheduling|scheduler|sincronia|sync|synchronization|tarefa|tarefas|task|tasks|processor|worker|cron)\b/i,
    skills: [],
    sections: ['11.2 (BullMQ)', '15 (Data Flows)'],
    message: 'Consulte secao 11.2 - 5 queues + 8 job types. Verifique dead letter queue.',
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // WEBSOCKET & REALTIME TRIGGERS (PT + EN)
  // =============================================================
  websocket: {
    patterns: /\b(websocket|sockets?|realtime|real[\s\-]?time|tempo[\s\-]?real|evento|eventos|event|events|broadcast|room|rooms|subscription|subscriptions|notificacao|notificacoes|notification|notifications|stream|streaming|push)\b/i,
    skills: [],
    sections: ['11.1 (WebSocket)', '15 (Data Flows)'],
    message: 'Consulte secao 11.1 - 15+ tipos de eventos WebSocket documentados.',
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // DOCUMENTATION TRIGGERS (PT + EN)
  // =============================================================
  documentation: {
    patterns: /\b(documentacao|documentation|docs|readme|roadmap|architecture|arquitetura|changelog|known[\s\-]?issues|claude\.md|gemini\.md|index\.md|install|database[\s\-]?schema|mapeamento|guide|guia|manual|specification|spec)\b/i,
    skills: ['sync-docs'],
    sections: ['1 (Context Loading)', 'INDEX.md'],
    message: 'CLAUDE.md e GEMINI.md devem ser identicos. Consulte INDEX.md para mapa completo.',
    priority: 'low',
    weight: 3
  },

  // =============================================================
  // MCP & TOOLS TRIGGERS (PT + EN)
  // =============================================================
  mcp: {
    patterns: /\b(mcp|mcps|sequential[\s\-]?thinking|chrome[\s\-]?devtools|react[\s\-]?devtools|triplo|triple|ferramenta|ferramentas|tool|tools|extensao|extensoes|extension|extensions|skill|skills|hook|hooks|sub[\s\-]?agent|subagent|ai|assistant|claude)\b/i,
    skills: ['mcp-triplo'],
    sections: ['21 (MCP & Tools)', 'METODOLOGIA_MCPS_INTEGRADA.md'],
    message: 'Use MCP Triplo: Playwright + Chrome DevTools + a11y. Consulte secao 21.',
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // ENVIRONMENT & CONFIG TRIGGERS (PT + EN)
  // =============================================================
  environment: {
    patterns: /\b(timezone|fuso[\s\-]?horario|config|configuracao|configuration|env|environment|variavel|variaveis|variable|variables|versao|version|atualizar|update|atualizada|atualizado|updated|ultima|ultimo|latest|recente|recent|secrets|\.env|settings|preferences)\b/i,
    skills: [],
    sections: ['1 (Context Loading)', '19 (Docker)'],
    message: 'Timezone: America/Sao_Paulo. Verifique .env e configuracoes antes de iniciar.',
    priority: 'low',
    weight: 3
  },

  // =============================================================
  // === NOVAS CATEGORIAS v3.0 ===
  // =============================================================

  // =============================================================
  // WEB RESEARCH TRIGGERS (PT + EN)
  // =============================================================
  webResearch: {
    patterns: /\b(pesquisar|research|best[\s\-]?practices|melhores[\s\-]?pr[aá]ticas|como[\s\-]?fazer|how[\s\-]?to|documenta[çc][aã]o[\s\-]?oficial|official[\s\-]?docs|alternativas|alternatives|comparar|compare|dificuldade|difficulty|n[aã]o[\s\-]?sei|don'?t[\s\-]?know|qual[\s\-]?usar|which[\s\-]?one|melhor[\s\-]?op[çc][aã]o|best[\s\-]?option|stackoverflow|forum)\b/i,
    skills: [],
    sections: ['22 (WebSearch Strategy)', 'BEST_PRACTICES'],
    message: `PESQUISA PARALELA RECOMENDADA:
  1. WebSearch: "[tecnologia] best practices 2025"
  2. WebSearch: "[tecnologia] official documentation"
  3. WebSearch: "[problema] solution stackoverflow"
  4. WebSearch: "[alternativas] comparison 2025"
  FONTES: docs oficiais > blogs 2024-2025 > stackoverflow
  CROSS-VALIDATION: Minimo 3 fontes concordando`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // POST-IMPLEMENTATION TRIGGERS (PT + EN)
  // =============================================================
  postImplementation: {
    patterns: /\b(pronto|done|completo|complete|terminado|finished|feito|ready|implementado|implemented|funciona|works|testado|tested|finalizado|finalized)\b/i,
    skills: ['check-ecosystem', 'mcp-triplo'],
    sections: ['6 (Post-Implementation)', '8 (100% Coverage)', '9 (Parallel Testing)'],
    message: `VALIDACAO POS-IMPLEMENTACAO OBRIGATORIA:
  1. Execute /check-ecosystem para validacao 100%
  2. Rode MCP Triplo (Playwright + DevTools + a11y)
  3. Verifique cobertura de testes
  4. Atualize CHANGELOG.md`,
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // REGRESSION TRIGGERS (PT + EN)
  // =============================================================
  regression: {
    patterns: /\b(regress[aã]o|regressions?|quebrou|quebrada|quebrado|broken|broke|parou|stopped|n[aã]o[\s\-]?funciona|doesn'?t[\s\-]?work|era[\s\-]?para|was[\s\-]?working|antes[\s\-]?funcionava|side[\s\-]?effect|efeito[\s\-]?colateral|deixou[\s\-]?de|stopped[\s\-]?working|unexpected|inesperado|behavior|comportamento)\b/i,
    skills: [],
    sections: ['7 (Troubleshooting)', '13 (Test Gaps)'],
    message: `REGRESSAO DETECTADA - ACOES:
  1. NAO corrija o sintoma, investigue ROOT CAUSE
  2. Execute E2E em TODAS 18 paginas
  3. Verifique KNOWN-ISSUES.md para padroes similares
  4. Documente solucao para prevenir recorrencia`,
    priority: 'critical',
    weight: 10
  },

  // =============================================================
  // DOCUMENTATION SYNC TRIGGERS (PT + EN)
  // =============================================================
  docSync: {
    patterns: /\b(sincronizar[\s\-]?docs|sync[\s\-]?docs|atualizar[\s\-]?doc|update[\s\-]?doc|claude\.md|gemini\.md|sincroniza[çc][aã]o|synchronization|manter[\s\-]?sync|keep[\s\-]?sync|docs[\s\-]?iguais|docs[\s\-]?identical|espelhar|mirror|replicar|replicate)\b/i,
    skills: ['sync-docs'],
    sections: ['1 (Context)', '5 (Documentation)'],
    message: `SINCRONIZACAO DE DOCUMENTACAO:
  1. Execute /sync-docs
  2. CLAUDE.md e GEMINI.md devem ser 100% identicos
  3. Atualize ROADMAP.md com fase atual
  4. Adicione entrada no CHANGELOG.md`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // TEST COVERAGE TRIGGERS (PT + EN)
  // =============================================================
  testCoverage: {
    patterns: /\b(cobertura[\s\-]?de[\s\-]?teste|test[\s\-]?coverage|gap[\s\-]?de[\s\-]?teste|test[\s\-]?gap|aumentar[\s\-]?cobertura|increase[\s\-]?coverage|sem[\s\-]?teste|no[\s\-]?test|falta[\s\-]?teste|missing[\s\-]?test|untested|nao[\s\-]?testado|nao[\s\-]?testada|coverage[\s\-]?report|relatorio[\s\-]?cobertura|nyc|istanbul|jest[\s\-]?coverage)\b/i,
    skills: [],
    sections: ['13 (Test Gaps)', '6 (Validation)'],
    message: `COBERTURA DE TESTES:
  Consulte secao 13 do CHECKLIST
  - Backend: 62% (meta: 80%)
  - Frontend: 0% (meta: 50%)
  - E2E: 19 arquivos
  Crie multiplos cenarios: Unit + Integration + E2E`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // DEPLOYMENT TRIGGERS (PT + EN)
  // =============================================================
  deployment: {
    patterns: /\b(deploy|deploying|deployed|produ[çc][aã]o|production|release|releasing|go[\s\-]?live|publicar|publicado|publicada|publish|published|lan[çc]ar|lan[çc]ado|lan[çc]ada|launch|launched|subir|subindo|upload[\s\-]?prod|staging|homologa[çc][aã]o|homologar|ci[\s\-]?cd|pipeline|rollout)\b/i,
    skills: [],
    sections: ['6 (Post-Implementation)', '19 (Docker)'],
    message: `PRE-DEPLOY CHECKLIST:
  1. Zero Tolerance: 0 erros TypeScript + Build OK
  2. Todos containers healthy (docker ps)
  3. Health check endpoints respondendo
  4. Backup de dados criticos se aplicavel
  5. Rollback plan documentado`,
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // ECOSYSTEM VALIDATION TRIGGERS (PT + EN)
  // =============================================================
  ecosystem: {
    patterns: /\b(ecossistema|ecosystem|valida[çc][aã]o[\s\-]?completa|full[\s\-]?validation|100[\s\-]?porcento|cem[\s\-]?por[\s\-]?cento|validar[\s\-]?tudo|validate[\s\-]?all|sistema[\s\-]?completo|complete[\s\-]?system|end[\s\-]?to[\s\-]?end[\s\-]?validation|validacao[\s\-]?e2e|health[\s\-]?check[\s\-]?completo|full[\s\-]?health[\s\-]?check)\b/i,
    skills: ['check-ecosystem', 'mcp-triplo'],
    sections: ['6-21 (Full Ecosystem)'],
    message: `VALIDACAO 100% DO ECOSSISTEMA:
  Use PM Expert com 3 agentes paralelos:
  - Frontend: 18 paginas + WCAG 2.1 AA
  - Backend: 11 controllers + endpoints
  - Infra: 21 containers Docker
  Execute: /check-ecosystem`,
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // AGENT HELP TRIGGERS (PT + EN)
  // =============================================================
  agentHelp: {
    patterns: /\b(preciso[\s\-]?de[\s\-]?ajuda|need[\s\-]?help|n[aã]o[\s\-]?consigo|can'?t[\s\-]?do|complexo|complex|dif[ií]cil|difficult|especialista|specialist|usar[\s\-]?agente|use[\s\-]?agent|sub[\s\-]?agent|subagent|invocar[\s\-]?agente|invoke[\s\-]?agent|delegar|delegate|assistencia|assistance|suporte|support)\b/i,
    skills: [],
    sections: ['21 (MCP & Tools)', 'AGENTS_README'],
    message: `AGENTES ESPECIALIZADOS DISPONIVEIS:
  - pm-expert: Validacao 100% ecossistema
  - e2e-testing-expert: Playwright + MCP Triplo
  - backend-api-expert: NestJS, TypeORM
  - frontend-components-expert: Next.js, React
  - scraper-development-expert: Playwright Python
  - typescript-validation-expert: Type safety
  Invoque: Task({ subagent_type: "nome-do-agent" })`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // IMPROVEMENT & EVOLUTION TRIGGERS (PT + EN)
  // =============================================================
  improvement: {
    patterns: /\b(melhorar|melhorado|melhorada|improve|improved|evoluir|evoluido|evoluida|evolve|evolved|otimizar|otimizado|otimizada|optimize|optimized|refatorar|refatorado|refatorada|refactor|refactored|modernizar|modernizado|modernizada|modernize|modernized|upgrade|upgraded|d[ií]vida[\s\-]?t[ée]cnica|tech[\s\-]?debt|evolu[çc][aã]o|evolution|aprimorar|aprimorado|aprimorada|enhance|enhanced|enhancement)\b/i,
    skills: [],
    sections: ['15 (Performance)', '3 (Patterns)'],
    message: `MELHORIA CONTINUA:
  1. WebSearch: "[area] best practices 2025"
  2. Consulte ARCHITECTURE.md para padroes
  3. Identifique tech debt no codigo
  4. Priorize: Critical > High > Medium > Low
  5. Documente mudancas no CHANGELOG.md`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // URGENCY & CRITICAL TRIGGERS (PT + EN)
  // =============================================================
  urgency: {
    patterns: /\b(urgente|urgent|urgency|cr[ií]tico|cr[ií]tica|critical|emerg[eê]ncia|emergency|produ[çc][aã]o[\s\-]?caiu|production[\s\-]?down|bloqueado|bloqueada|blocked|blocker|p0|p1|hotfix|hot[\s\-]?fix|fora[\s\-]?do[\s\-]?ar|offline|down|caiu|indispon[ií]vel|unavailable|outage|incidente|incident|sev1|sev0|severity)\b/i,
    skills: [],
    sections: ['7 (Troubleshooting)', 'KNOWN-ISSUES'],
    message: `URGENCIA DETECTADA - PROTOCOLO:
  1. PARE: Nao faca mudancas precipitadas
  2. AVALIE: Qual e o impacto real?
  3. DOCUMENTE: O que aconteceu, quando, logs
  4. INVESTIGUE: Root cause (nao sintoma)
  5. TESTE: Validacao antes de deploy
  6. COMUNIQUE: Atualize stakeholders`,
    priority: 'critical',
    weight: 10
  },

  // =============================================================
  // === NEW CATEGORIES v4.0 (17 novas) ===
  // =============================================================

  // =============================================================
  // MIGRATION TRIGGERS (PT + EN)
  // =============================================================
  migration: {
    patterns: /\b(migra[çc][aã]o|migration|migrar|migrate|migrando|migrating|migrado|migrada|migrated|reverter|revert|reverting|rollback|seed|seeding|seeds|schema[\s\-]?change|mudan[çc]a[\s\-]?schema|typeorm|sequelize|knex|prisma[\s\-]?migrate)\b/i,
    skills: [],
    sections: ['17 (Database)', '5 (Documentation)'],
    message: `MIGRACAO DE BANCO:
  1. Backup ANTES de qualquer migration
  2. Test migration em ambiente local primeiro
  3. Verifique reversibilidade (down migration)
  4. Documente mudancas no DATABASE_SCHEMA.md
  5. Atualize entities TypeORM correspondentes`,
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // VALIDATION & DTO TRIGGERS (PT + EN)
  // =============================================================
  validation: {
    patterns: /\b(valida[çc][aã]o|validation|validar|validate|validando|validating|validado|validada|validated|dto|data[\s\-]?transfer|schema|constraint|constraints|class[\s\-]?validator|yup|zod|joi|sanitizar|sanitize|sanitization)\b/i,
    skills: [],
    sections: ['3 (Patterns)', '7 (Troubleshooting)'],
    message: `VALIDACAO DE DADOS:
  1. Use class-validator decorators no backend
  2. Valide inputs na entrada (controller level)
  3. DTOs separados para Create/Update/Response
  4. Cross-field validation com @ValidatorConstraint
  5. Frontend: validacao dupla (form + API)`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // ROUTING & NAVIGATION TRIGGERS (PT + EN)
  // =============================================================
  routing: {
    patterns: /\b(rota|rotas|route|routes|routing|navega[çc][aã]o|navigation|navigate|navigating|layout|layouts|param|params|parametro|parametros|parameter|parameters|path|paths|url|urls|redirect|redirecion|link|links|app[\s\-]?router|pages[\s\-]?router)\b/i,
    skills: [],
    sections: ['3.2 (Frontend)', '8.1 (Pages)'],
    message: `ROTAS E NAVEGACAO:
  1. Next.js 14 usa App Router (pasta app/)
  2. Route groups: (dashboard) para auth, auth para public
  3. Parametros dinamicos: [ticker], [id]
  4. Layouts compartilhados: layout.tsx
  5. Loading states: loading.tsx por rota`,
    priority: 'low',
    weight: 4
  },

  // =============================================================
  // REACT HOOK TRIGGERS (PT + EN)
  // =============================================================
  hook: {
    patterns: /\b(hook|hooks|use[A-Z][a-zA-Z]+|useState|useEffect|useCallback|useMemo|useRef|useContext|useQuery|useMutation|custom[\s\-]?hook|react[\s\-]?hook|tanstack|react[\s\-]?query)\b/i,
    skills: [],
    sections: ['3.2 (Frontend)', '8.1 (Pages)'],
    message: `REACT HOOKS:
  18 hooks customizados disponiveis:
  - useAssets, usePortfolio, useAnalysis
  - useWebSocket, useSyncWebSocket
  - useDataSources, useDiscrepancyHooks
  Padrao: hooks em frontend/src/lib/hooks/`,
    priority: 'low',
    weight: 4
  },

  // =============================================================
  // MIDDLEWARE & INTERCEPTOR TRIGGERS (PT + EN)
  // =============================================================
  middleware: {
    patterns: /\b(middleware|middlewares|interceptador|interceptor|interceptors|guarda|guard|guards|pipe|pipes|filter|filters|nest[\s\-]?middleware|next[\s\-]?middleware|express[\s\-]?middleware)\b/i,
    skills: [],
    sections: ['3.1 (Backend)', '8.2 (Controllers)'],
    message: `MIDDLEWARE & INTERCEPTORS:
  Backend NestJS:
  - Guards: autenticacao/autorizacao
  - Interceptors: transform response
  - Pipes: validacao de input
  - Filters: exception handling
  Frontend Next.js: middleware.ts na raiz`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // TRANSACTION TRIGGERS (PT + EN)
  // =============================================================
  transaction: {
    patterns: /\b(transa[çc][aã]o|transa[çc][oõ]es|transaction|transactions|transactional|atomico|atomica|atomic|atomicity|acid|commit|rollback|savepoint|isolation|lock|locking|deadlock)\b/i,
    skills: [],
    sections: ['17 (Database)'],
    message: `TRANSACOES DE BANCO:
  1. Use QueryRunner para transacoes manuais
  2. @Transaction() decorator quando disponivel
  3. Sempre trate rollback em caso de erro
  4. Evite transacoes longas (locks)
  5. Teste cenarios de falha parcial`,
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // INDEX & QUERY OPTIMIZATION TRIGGERS (PT + EN)
  // =============================================================
  index: {
    patterns: /\b([ií]ndice|[ií]ndices|index|indexes|indices|indexa[çc][aã]o|indexing|n\+1|query[\s\-]?lenta|slow[\s\-]?query|otimiza[çc][aã]o[\s\-]?query|query[\s\-]?optimization|explain|analyze|full[\s\-]?scan|table[\s\-]?scan|covering[\s\-]?index)\b/i,
    skills: [],
    sections: ['17 (Database)', '15 (Performance)'],
    message: `INDICES E OTIMIZACAO:
  1. EXPLAIN ANALYZE para queries lentas
  2. Indices compostos para WHERE multiplos
  3. Evite N+1: use eager loading
  4. Pagination obrigatoria para listas
  5. Cache Redis para queries frequentes`,
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // CACHE TRIGGERS (PT + EN)
  // =============================================================
  cache: {
    patterns: /\b(cache|caches|caching|cached|redis|memcached|ttl|time[\s\-]?to[\s\-]?live|invalida[çc][aã]o|invalidation|invalidar|invalidate|stale|expirar|expire|expiration|cache[\s\-]?hit|cache[\s\-]?miss|warm[\s\-]?cache)\b/i,
    skills: [],
    sections: ['15 (Performance)', '11 (Real-time)'],
    message: `ESTRATEGIA DE CACHE:
  Redis disponivel em :6479
  1. Cache de leitura para dados pouco mutaveis
  2. TTL baseado em frequencia de atualizacao
  3. Invalidacao em write operations
  4. Cache-aside pattern preferido
  5. Monitore hit/miss ratio`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // CROSS-VALIDATION TRIGGERS (PT + EN)
  // =============================================================
  crossvalidation: {
    patterns: /\b(valida[çc][aã]o[\s\-]?cruzada|cross[\s\-]?validation|cross[\s\-]?validate|consenso|consensus|fonte|fontes|source|sources|discrepancia|discrepancy|divergencia|divergence|divergente|divergent|comparar[\s\-]?fontes|compare[\s\-]?sources|confian[çc]a|confidence|score[\s\-]?confian[çc]a|confidence[\s\-]?score)\b/i,
    skills: [],
    sections: ['11.3 (External APIs)', '20 (Data Sources)'],
    message: `CROSS-VALIDATION DE DADOS:
  REGRA: Minimo 3 fontes concordando
  Threshold de discrepancia: 10%
  Fontes ativas: 6 (Fundamentus, BRAPI, etc)
  Calcule confidence score baseado em consenso
  Documente divergencias para auditoria`,
    priority: 'critical',
    weight: 9
  },

  // =============================================================
  // DIVIDEND TRIGGERS (PT + EN)
  // =============================================================
  dividend: {
    patterns: /\b(dividendo|dividendos|dividend|dividends|provento|proventos|jcp|juros[\s\-]?sobre[\s\-]?capital|jscp|rendimento|rendimentos|yield|yields|payout|distribui[çc][aã]o|distribution|ex[\s\-]?dividendo|ex[\s\-]?dividend|data[\s\-]?com|record[\s\-]?date|pagamento|payment[\s\-]?date)\b/i,
    skills: [],
    sections: ['14 (Financial)', '8.1 (Pages)'],
    message: `DIVIDENDOS E PROVENTOS:
  1. Tipos: Dividendo, JCP, Bonificacao
  2. Datas: Data-com, Ex-dividendo, Pagamento
  3. Calculo de Dividend Yield
  4. Historico em asset_dividends table
  5. Cross-validate com Status Invest + Fundamentus`,
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // OPTIONS TRIGGERS (PT + EN)
  // =============================================================
  options: {
    patterns: /\b(op[çc][aã]o|op[çc][oõ]es|option|options|greeks|delta|gamma|theta|vega|rho|strike|strikes|vencimento|expiration|expiry|call|calls|put|puts|covered[\s\-]?call|wheel[\s\-]?strategy|premia|premium|volatilidade|volatility|iv|implied[\s\-]?volatility|black[\s\-]?scholes|intrinsic|extrinsic|moneyness|ITM|OTM|ATM|in[\s\-]?the[\s\-]?money|out[\s\-]?the[\s\-]?money|at[\s\-]?the[\s\-]?money|straddle|strangle|spread|butterfly|iron[\s\-]?condor)\b/i,
    skills: [],
    sections: ['18 (Scrapers)', '20 (Data Sources)'],
    message: `OPCOES E DERIVATIVOS:
  Wheel Strategy implementada em /wheel
  Greeks: Delta, Gamma, Theta, Vega, Rho
  Dados de opcoes via scraper Opcoes.net.br
  Calculos de IV e Black-Scholes disponiveis
  Estrategias: Covered Call, Straddle, Spread`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // HEALTH CHECK TRIGGERS (PT + EN)
  // =============================================================
  health: {
    patterns: /\b(sa[úu]de|health|health[\s\-]?check|healthcheck|probe|probes|liveness|readiness|status|alive|ping|heartbeat|verifica[çc][aã]o[\s\-]?sa[úu]de|diagnostico|diagnostic|uptime|disponibilidade|availability)\b/i,
    skills: [],
    sections: ['14 (Health)', '19 (Docker)'],
    message: `HEALTH CHECKS:
  Backend: GET /api/v1/health
  Containers: docker inspect --format='{{.State.Health.Status}}'
  Dashboard: /health (frontend)
  Verifique:
  - Database connection
  - Redis connection
  - External APIs reachability`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // NETWORK TRIGGERS (PT + EN)
  // =============================================================
  network: {
    patterns: /\b(rede|network|networking|dns|hostname|conectividade|connectivity|firewall|porta|portas|port|ports|proxy|proxies|cors|ssl|tls|https|certificate|certificado|timeout[\s\-]?rede|network[\s\-]?timeout|latencia[\s\-]?rede|network[\s\-]?latency)\b/i,
    skills: [],
    sections: ['19 (Docker)', '8.3 (Containers)'],
    message: `CONFIGURACAO DE REDE:
  Network: invest_network (172.19.0.0/16)
  Portas principais: 3100, 3101, 5532, 6479
  CORS configurado no backend
  DNS interno Docker funcionando
  SSL/TLS para producao`,
    priority: 'low',
    weight: 4
  },

  // =============================================================
  // BACKUP TRIGGERS (PT + EN)
  // =============================================================
  backup: {
    patterns: /\b(backup|backups|recupera[çc][aã]o|recovery|dump|dumps|restore|restaurar|restaura[çc][aã]o|restoration|snapshot|snapshots|ponto[\s\-]?restaura[çc][aã]o|restore[\s\-]?point|pg[\s\-]?dump|pg[\s\-]?restore|replica|replication)\b/i,
    skills: [],
    sections: ['17 (Database)', '19 (Docker)'],
    message: `BACKUP E RECUPERACAO:
  PostgreSQL:
  - pg_dump para backup logico
  - Volume: postgres_data
  Redis:
  - RDB snapshots automaticos
  - Volume: redis_data
  SEMPRE backup antes de migrations!`,
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // RETRY & RESILIENCE TRIGGERS (PT + EN)
  // =============================================================
  retry: {
    patterns: /\b(tentativa|tentativas|retry|retries|retrying|backoff|exponential[\s\-]?backoff|backoff[\s\-]?exponencial|max[\s\-]?retries|limite[\s\-]?tentativas|falha[\s\-]?temporaria|transient[\s\-]?failure|reconectar|reconnect|reconexao|reconnection)\b/i,
    skills: [],
    sections: ['7 (Troubleshooting)', '18 (Scrapers)'],
    message: `ESTRATEGIA DE RETRY:
  1. Exponential backoff: 1s, 2s, 4s, 8s...
  2. Max retries: 3-5 para APIs externas
  3. Jitter para evitar thundering herd
  4. Circuit breaker apos falhas consecutivas
  5. Log cada tentativa para debug`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // RATE LIMIT TRIGGERS (PT + EN)
  // =============================================================
  ratelimit: {
    patterns: /\b(limite[\s\-]?taxa|rate[\s\-]?limit|rate[\s\-]?limiting|quota|quotas|throttle|throttling|limite[\s\-]?requisi[çc][oõ]es|request[\s\-]?limit|too[\s\-]?many[\s\-]?requests|429|api[\s\-]?limit|burst|cooldown)\b/i,
    skills: [],
    sections: ['20 (Data Sources)', '12 (Limits)'],
    message: `RATE LIMITING:
  APIs externas tem limites!
  - StatusInvest: 60 req/min
  - BRAPI: 15 req/min (free)
  - B3: 100 req/min
  Implemente delays entre requests
  Use queue para requests em massa`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // CIRCUIT BREAKER TRIGGERS (PT + EN)
  // =============================================================
  circuit: {
    patterns: /\b(circuito|circuit|circuit[\s\-]?breaker|disjuntor|fallback|fallbacks|resili[eê]ncia|resilience|resilient|fail[\s\-]?fast|fail[\s\-]?safe|graceful[\s\-]?degradation|degrada[çc][aã]o[\s\-]?graciosa|bulkhead|isolation)\b/i,
    skills: [],
    sections: ['11.3 (External APIs)', '20 (Data Sources)'],
    message: `CIRCUIT BREAKER PATTERN:
  Estados: Closed → Open → Half-Open
  1. Closed: operacao normal
  2. Open: apos N falhas, rejeita requests
  3. Half-Open: testa recuperacao
  Implemente para APIs externas criticas
  Fallback: dados em cache ou erro gracioso`,
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // === NEW CATEGORIES v5.0 (11 domain-specific) ===
  // =============================================================

  // =============================================================
  // TECHNICAL INDICATORS TRIGGERS (PT + EN)
  // =============================================================
  technicalIndicators: {
    patterns: /\b(RSI|MACD|SMA|EMA|media[\s\-]?movel|moving[\s\-]?average|bollinger|BB|ATR|stochastic|williams|ADX|oscilador|oscillator|divergencia|divergence|crossover|sobrecomprado|overbought|sobrevendido|oversold|ichimoku|fibonacci|suporte|support|resistencia|resistance|tendencia|trend|momentum|volume[\s\-]?profile|VWAP|OBV|on[\s\-]?balance[\s\-]?volume)\b/i,
    skills: [],
    sections: ['18 (Scrapers)', '20 (Data Sources)'],
    message: `INDICADORES TECNICOS:
  Disponiveis: RSI, MACD, Bollinger Bands, SMA, EMA
  Python Service: localhost:8001 para calculos
  Biblioteca: pandas-ta, talib
  Graficos: lightweight-charts para candlestick
  Validacao: Compare com TradingView/StatusInvest`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // FUNDAMENTAL METRICS TRIGGERS (PT + EN)
  // =============================================================
  fundamentalMetrics: {
    patterns: /\b(P\/L|P\/E|ROE|ROA|ROIC|margem|margin|EBITDA|LPA|EPS|VPA|book[\s\-]?value|liquidez|liquidity|endividamento|debt[\s\-]?ratio|dividend[\s\-]?yield|payout|free[\s\-]?cash[\s\-]?flow|FCF|CAPEX|enterprise[\s\-]?value|EV|multiplo|multiple|valuation|lucro[\s\-]?liquido|net[\s\-]?income|receita|revenue|patrimonio|equity|ativo[\s\-]?total|total[\s\-]?assets)\b/i,
    skills: [],
    sections: ['14 (Financial)', '3.1 (Backend)'],
    message: `METRICAS FUNDAMENTALISTAS:
  Fontes: Fundamentus, StatusInvest, Investidor10
  Cross-validation: Minimo 3 fontes
  Entidade: Asset (fundamentals JSON field)
  Calculos: ROE, P/L, Dividend Yield, etc.
  Precisao: Decimal.js obrigatorio`,
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // MACROECONOMIC TRIGGERS (PT + EN)
  // =============================================================
  macro: {
    patterns: /\b(SELIC|IPCA|PIB|GDP|infla[çc][aã]o|inflation|c[aâ]mbio|exchange[\s\-]?rate|d[oó]lar|dollar|real|juros|interest[\s\-]?rate|taxa[\s\-]?b[aá]sica|fed|copom|commodit|barril|oil|ouro|gold|commodities|cdi|tr|igpm|inpc|poupan[çc]a|savings|tesouro|treasury|bcb|banco[\s\-]?central)\b/i,
    skills: [],
    sections: ['20 (Data Sources)', 'economic_indicators'],
    message: `INDICADORES MACROECONOMICOS:
  Fonte principal: BCB (Banco Central)
  Entidade: EconomicIndicator
  Endpoint: GET /economic-indicators
  Atualizacao: Diaria para SELIC, CDI
  Scraper: bcb.py (Playwright)`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // CORPORATE ACTIONS TRIGGERS (PT + EN)
  // =============================================================
  corporateActions: {
    patterns: /\b(desdobramento|split|grupamento|reverse[\s\-]?split|bonifica[çc][aã]o|bonus[\s\-]?shares|inplit|subscri[çc][aã]o|rights[\s\-]?issue|cis[aã]o|spinoff|fus[aã]o|merger|aquisi[çc][aã]o|acquisition|OPA|takeover|reorganiza[çc][aã]o|incorpora[çc][aã]o|mudan[çc]a[\s\-]?ticker|ticker[\s\-]?change|ajuste|adjustment|corporate[\s\-]?action)\b/i,
    skills: [],
    sections: ['14 (Financial)', '17 (Database)'],
    message: `ACOES CORPORATIVAS:
  Entidade: TickerChange (historico de mudancas)
  Tipos: Split, Grupamento, Bonificacao, Fusao
  CRITICO: Ajustar precos historicos!
  Fontes: B3, CVM, StatusInvest
  Validacao: Cross-validate antes de aplicar`,
    priority: 'critical',
    weight: 9
  },

  // =============================================================
  // WHEEL STRATEGY TRIGGERS (PT + EN)
  // =============================================================
  wheelStrategy: {
    patterns: /\b(wheel[\s\-]?strategy|covered[\s\-]?call|cash[\s\-]?secured[\s\-]?put|pr[eê]mio|premium|colateral|collateral|exerc[ií]cio|assignment|rolagem|roll|notional|delta[\s\-]?neutral|venda[\s\-]?coberta|selling[\s\-]?puts|selling[\s\-]?calls|income[\s\-]?strategy|theta[\s\-]?gang|wheel[\s\-]?candidatos|wheel[\s\-]?candidates)\b/i,
    skills: [],
    sections: ['18 (Scrapers)', '8.1 (Pages /wheel)'],
    message: `WHEEL STRATEGY:
  Pagina: /wheel (candidatos e posicoes)
  Fluxo: Sell Put → Assignment → Sell Call
  Dados: Opcoes.net.br via scraper
  Metricas: Premium, Collateral, ROI
  Endpoints: GET /wheel/candidates, /wheel/positions`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // SENTIMENT TRIGGERS (PT + EN)
  // =============================================================
  sentiment: {
    patterns: /\b(sentimento|sentiment|bullish|bearish|alta|baixa|not[ií]cia|not[ií]cias|news|recomenda[çc][aã]o|recommendation|upgrade|downgrade|target[\s\-]?price|pre[çc]o[\s\-]?alvo|consenso|consensus|analista|analyst|rating|ratings|outlook|perspectiva|expectativa|expectation|otimista|pessimista|neutro|neutral)\b/i,
    skills: [],
    sections: ['20 (Data Sources)', 'news'],
    message: `ANALISE DE SENTIMENTO:
  Fontes de noticias: Google News, InfoMoney
  Entidade: News
  Endpoint: GET /news
  Analise: Keywords bullish/bearish
  Scraper: news scrapers (Python)`,
    priority: 'low',
    weight: 4
  },

  // =============================================================
  // RISK MANAGEMENT TRIGGERS (PT + EN)
  // =============================================================
  riskManagement: {
    patterns: /\b(risco|risk|VaR|value[\s\-]?at[\s\-]?risk|drawdown|sharpe|sortino|beta|alpha|correla[çc][aã]o|correlation|volatilidade|volatility|hedge|hedging|diversifica[çc][aã]o|diversification|alavancagem|leverage|exposi[çc][aã]o|exposure|stop[\s\-]?loss|take[\s\-]?profit|position[\s\-]?sizing|risk[\s\-]?reward|risco[\s\-]?retorno)\b/i,
    skills: [],
    sections: ['14 (Financial)', '15 (Performance)'],
    message: `GESTAO DE RISCO:
  Metricas: Sharpe, Sortino, Max Drawdown
  Calculo: Python Service (pandas)
  Portfolio: Correlacao entre ativos
  Limites: Stop-loss, position sizing
  Diversificacao: Por setor, por tipo`,
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // MARKET INDICES TRIGGERS (PT + EN)
  // =============================================================
  marketIndices: {
    patterns: /\b(IBOV|IBRX|SMLL|IDIV|IFIX|[ií]ndice|[ií]ndices|index|indexes|Novo[\s\-]?Mercado|segmento|segment|n[ií]vel[\s\-]?1|n[ií]vel[\s\-]?2|ETF|ETFs|fundo[\s\-]?[ií]ndice|FII|FIIs|REIT|REITs|BDR|BDRs|ADR|ADRs|BOVA11|IVVB11|benchmark|benchmarking)\b/i,
    skills: [],
    sections: ['17 (Database)', '8.1 (Pages)'],
    message: `INDICES E SEGMENTOS B3:
  Indices: IBOV, IBRX, SMLL, IDIV, IFIX
  Segmentos: Novo Mercado, N1, N2
  ETFs: BOVA11, IVVB11, etc.
  FIIs: Fundos Imobiliarios
  Entidade: Asset (segment, index fields)`,
    priority: 'medium',
    weight: 5
  },

  // =============================================================
  // DATA SOURCES TRIGGERS (PT + EN)
  // =============================================================
  dataSources: {
    patterns: /\b(COTAHIST|BRAPI|Fundamentus|StatusInvest|Investidor10|Investsite|CVM|B3|fonte[\s\-]?de[\s\-]?dados|data[\s\-]?source|data[\s\-]?sources|provider|providers|API[\s\-]?externa|external[\s\-]?API|scraper[\s\-]?fonte|origem[\s\-]?dados|data[\s\-]?origin|Yahoo[\s\-]?Finance|Alpha[\s\-]?Vantage|Quandl)\b/i,
    skills: [],
    sections: ['18 (Scrapers)', '20 (Data Sources)'],
    message: `FONTES DE DADOS:
  Ativas: Fundamentus, BRAPI, StatusInvest, BCB
  COTAHIST: Dados historicos B3 (1986-2025)
  Cross-validation: Minimo 3 fontes
  Scrapers: 35 Python + TypeScript
  Endpoint: GET /data-sources`,
    priority: 'high',
    weight: 7
  },

  // =============================================================
  // CI/CD TRIGGERS (PT + EN)
  // =============================================================
  cicd: {
    patterns: /\b(CI\/CD|cicd|pipeline|pipelines|GitHub[\s\-]?Actions|workflow|workflows|deploy[\s\-]?autom[aá]tico|auto[\s\-]?deploy|continuous[\s\-]?integration|continuous[\s\-]?delivery|continuous[\s\-]?deployment|automation|automa[çc][aã]o|husky|pre[\s\-]?commit|lint[\s\-]?staged|git[\s\-]?hooks|build[\s\-]?pipeline|release[\s\-]?pipeline)\b/i,
    skills: [],
    sections: ['14 (Automation)', '19 (Docker)'],
    message: `CI/CD E AUTOMACAO:
  Git Hooks: Husky v9 (pre-commit, commit-msg)
  Pre-commit: TypeScript validation (tsc --noEmit)
  Commit-msg: Conventional Commits
  Pre-push: Build validation
  Docker: docker-compose para deploy local`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // DATA QUALITY TRIGGERS (PT + EN)
  // =============================================================
  dataQuality: {
    patterns: /\b(outlier|outliers|anomalia|anomalias|anomaly|anomalies|discrep[aâ]ncia|discrep[aâ]ncias|discrepancy|discrepancies|threshold|thresholds|limite|limites|gatilho|trigger|confiabilidade|reliability|score[\s\-]?confian[çc]a|confidence[\s\-]?score|data[\s\-]?quality|qualidade[\s\-]?dados|valida[çc][aã]o[\s\-]?dados|data[\s\-]?validation|sanity[\s\-]?check|integridade|integrity|consistencia|consistency)\b/i,
    skills: [],
    sections: ['11.3 (Cross-validation)', '20 (Data Sources)'],
    message: `QUALIDADE DE DADOS:
  Threshold de discrepancia: 10%
  Outlier detection: Z-score > 3
  Cross-validation: Minimo 3 fontes
  Entidade: Discrepancy (log de divergencias)
  Pagina: /discrepancies (visualizacao)`,
    priority: 'critical',
    weight: 9
  },

  // =============================================================
  // v5.1 - UNCERTAINTY DETECTION (PT + EN) - Added 2025-12-15
  // =============================================================
  uncertainty: {
    patterns: /\b(incerteza|incerto|uncertain|uncertainty|duvida|duvidas|doubt|doubtful|nao[\s\-]?sei|don['']?t[\s\-]?know|unsure|indefinido|indefinida|undefined|ambiguo|ambigua|ambiguous|clareza|clarity|nao[\s\-]?claro|unclear|confuso|confused|talvez|maybe|perhaps|provavelmente|probably|acho[\s\-]?que|i[\s\-]?think|nao[\s\-]?tenho[\s\-]?certeza|not[\s\-]?sure|qual[\s\-]?(?:a[\s\-]?)?melhor|which[\s\-]?(?:is[\s\-]?)?best|devo[\s\-]?usar|should[\s\-]?(?:i[\s\-]?)?use)\b/i,
    skills: [],
    sections: ['22 (WebSearch)', 'CLAUDE.md WebSearch Strategy'],
    message: `INCERTEZA DETECTADA - PESQUISA OBRIGATORIA:
  1. Use WebSearch ANTES de responder
  2. Execute 3-4 queries paralelas
  3. Cross-validate minimo 3 fontes
  4. Cite fontes usadas na resposta
  5. Documente pressupostos assumidos`,
    priority: 'critical',
    weight: 10
  },

  // =============================================================
  // v5.1 - DECISION MAKING (PT + EN) - Added 2025-12-15
  // =============================================================
  decisionMaking: {
    patterns: /\b(decidir|decide|decision|escolher|choose|choice|selecionar|select|optar|opt|alternativa|alternative|opcao|option|comparar|compare|versus|vs|tradeoff|trade[\s\-]?off|pros[\s\-]?(?:e[\s\-]?)?cons|vantagens[\s\-]?(?:e[\s\-]?)?desvantagens|advantages[\s\-]?(?:and[\s\-]?)?disadvantages)\b/i,
    skills: [],
    sections: ['22 (WebSearch)', '1-2 (Planning)'],
    message: `DECISAO ARQUITETURAL DETECTADA:
  1. WebSearch: 4 queries paralelas
  2. Compare alternativas objetivamente
  3. Liste pros/cons de cada opcao
  4. Recomende com justificativa
  5. Documente trade-offs assumidos`,
    priority: 'high',
    weight: 8
  },

  // =============================================================
  // v5.1 - CLARIFICATION (PT + EN) - Added 2025-12-15
  // =============================================================
  clarification: {
    patterns: /\b(esclarecer|clarify|clarification|confirmar|confirm|confirmation|verificar|verify|verification|validar[\s\-]?(?:com[\s\-]?)?(?:usuario|user)|check[\s\-]?with[\s\-]?user)\b/i,
    skills: [],
    sections: ['1-2 (Planning)', '7 (Troubleshooting)'],
    message: `CLARIFICACAO NECESSARIA:
  1. Identifique pontos ambiguos
  2. Formule perguntas especificas
  3. NAO assuma sem confirmar
  4. Documente respostas obtidas`,
    priority: 'medium',
    weight: 6
  },

  // =============================================================
  // v5.1 - ASSUMPTION DETECTION (PT + EN) - Added 2025-12-15
  // =============================================================
  assumption: {
    patterns: /\b(assumir|assume|assumption|pressuposto|presupposition|hipotese|hypothesis|suposicao|supposition|presumir|presume|presumption|inferir|infer|inference)\b/i,
    skills: [],
    sections: ['1-2 (Planning)', '7 (Troubleshooting)'],
    message: `PRESSUPOSTOS DETECTADOS:
  1. Liste todos os pressupostos
  2. Valide com evidencias ou pesquisa
  3. Documente pressupostos assumidos
  4. Marque como risco se nao validado`,
    priority: 'medium',
    weight: 5
  }
};

// Read stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const userPrompt = data.prompt || '';

    // Skip very short prompts
    if (userPrompt.length < 5) {
      process.exit(0);
      return;
    }

    let triggers = [];

    for (const [key, config] of Object.entries(KEYWORD_MAPPINGS)) {
      if (config.patterns.test(userPrompt)) {
        triggers.push({ key, ...config });
      }
    }

    // v5.2: Sort by priority (critical first) then by weight
    triggers.sort((a, b) => {
      const priorityDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.weight || 0) - (a.weight || 0);
    });

    // v5.2: Apply smart limits by priority instead of arbitrary 4
    const selectedTriggers = [];
    const countByPriority = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const trigger of triggers) {
      const priority = trigger.priority || 'medium';
      const maxForPriority = MAX_TRIGGERS_BY_PRIORITY[priority] || 2;

      if (countByPriority[priority] < maxForPriority) {
        selectedTriggers.push(trigger);
        countByPriority[priority]++;
      }
    }

    triggers = selectedTriggers;

    // v5.2: Record analytics if available
    if (analytics && triggers.length > 0) {
      try {
        analytics.recordKeywordMatch({
          categories: triggers.map(t => t.key),
          priorities: triggers.map(t => t.priority),
          total: triggers.length,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // Analytics error - continue without it
      }
    }

    // Show if triggers found
    if (triggers.length > 0) {
      console.log('');
      console.log('='.repeat(66));
      console.log('  CHECKLIST AUTO-TRIGGER: Instrucoes relevantes detectadas');
      console.log('='.repeat(66));

      triggers.forEach(t => {
        const priorityIcon = t.priority === 'critical' ? '🔴' :
                            t.priority === 'high' ? '🟠' :
                            t.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${priorityIcon} [${t.key.toUpperCase()}] (${t.priority || 'medium'})`);
        console.log(`  ${t.message}`);
        if (t.skills && t.skills.length > 0) {
          console.log(`    Skills: ${t.skills.join(', ')}`);
        }
        console.log(`    Secoes: ${t.sections.join(', ')}`);
        console.log('');
      });

      console.log('='.repeat(66));
      console.log('  Ref: CHECKLIST_ECOSSISTEMA_COMPLETO.md');
      console.log('');
    }

    process.exit(0);
  } catch (e) {
    // Parse error - exit silently
    process.exit(0);
  }
});

// Timeout fallback
setTimeout(() => process.exit(0), 2000);
