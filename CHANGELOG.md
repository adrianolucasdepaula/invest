# Changelog

All notable changes to the B3 AI Analysis Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-09

### Fixed

#### Authentication System
- **Google OAuth Login Flow** - Corrigido fluxo completo de autenticação OAuth com Google
  - Removida duplicação de `/v1` na URL de autenticação (`/api/v1/v1/auth/google` → `/api/v1/auth/google`)
  - Adicionado `/auth/google/callback` às rotas públicas do middleware para evitar loop de redirecionamento
  - Implementado tratamento de erros robusto no callback OAuth
  - Adicionado logging detalhado para debugging do fluxo de autenticação
  - Arquivos modificados:
    - `frontend/src/app/login/page.tsx` - Corrigida construção da URL OAuth
    - `frontend/src/middleware.ts` - Adicionada rota callback às rotas públicas
    - `backend/src/api/auth/auth.controller.ts` - Melhorado error handling e logging
    - `frontend/src/app/auth/google/callback/page.tsx` - Implementada página de callback completa

#### API Configuration
- **Correção das URLs da API** - Adicionado `/v1` em todas as configurações de API
  - `NEXT_PUBLIC_API_URL` corrigido de `http://localhost:3101/api` para `http://localhost:3101/api/v1`
  - Arquivos modificados:
    - `.env` (root) - Linhas 179 e 59
    - `docker-compose.yml` - Linha 347
    - `frontend/.env` - Linha 4

#### Frontend Stability
- **Dashboard AssetTable** - Corrigido crash quando `asset.volume` é null
  - Adicionado null check com fallback para `-` quando volume não está disponível
  - Arquivo modificado: `frontend/src/components/dashboard/asset-table.tsx:80`

- **API Client** - Melhorado gerenciamento de cookies e interceptors
  - Arquivo modificado: `frontend/src/lib/api.ts`

### Changed

#### Infrastructure
- **ChromeDriver Installation** - Atualizado método de instalação do ChromeDriver
  - Migrado de `chromedriver.storage.googleapis.com` (deprecated) para Chrome for Testing official source
  - Garante compatibilidade com versões mais recentes do Chrome
  - Arquivo modificado: `backend/api-service/Dockerfile`

- **Docker Compose** - Atualizadas variáveis de ambiente
  - Corrigido `NEXT_PUBLIC_API_URL` no serviço frontend
  - Arquivo modificado: `docker-compose.yml`

### Added

#### Documentation
- **Relatórios de Correção** - Adicionada documentação completa das correções
  - `RELATORIO_CORRECAO_OAUTH_LOGIN.md` - Relatório técnico detalhado das correções OAuth
  - `RESUMO_FINAL_CORRECOES.md` - Resumo executivo com checklist de funcionalidades
  - `RELATORIO_CONSOLIDADO_TESTES_COMPLETO.md` - Relatório completo de testes (Fases 1-3)
  - `RELATORIO_FINAL_COMPLETO.md` - Relatório final abrangente
  - `RELATORIO_FINAL_CORRECOES.md` - Relatório de correções finais
  - `RELATORIO_OAUTH_COMPLETO.md` - Documentação completa do OAuth
  - `SYNC_VALIDATION_REPORT.md` - Relatório de validação de sincronização
  - `VALIDATION_REPORT_FINAL.md` - Relatório final de validação

#### Tooling & Scripts
- **Scripts PowerShell** - Adicionados scripts de automação para configuração OAuth
  - `configurar-oauth-simples.ps1` - Script simplificado de configuração OAuth
  - `setup-oauth-cookies.ps1` - Script para setup de cookies OAuth

#### Configuration Templates
- **Environment Templates** - Adicionado template de variáveis de ambiente
  - `backend/api-service/.env.template` - Template para configuração do API Service

### Testing

#### Verified Functionality (100% Operational)
- ✅ Login com Email/Senha - Funcional
- ✅ Login com Google OAuth - Funcional
- ✅ Dashboard - Carregando sem erros
- ✅ Todos os 7 containers Docker - Healthy
- ✅ 27 Scrapers configurados - 316KB de cookies OAuth salvos

#### Test Results
- **Email/Password Login**: Testado com usuário `test@test.com` - ✅ PASSOU
- **Google OAuth Flow**: Testado fluxo completo end-to-end - ✅ PASSOU
- **Dashboard AssetTable**: Testado com dados null - ✅ PASSOU
- **Container Health**: Todos os containers reportando healthy - ✅ PASSOU

### Infrastructure Status

#### Docker Containers
| Serviço | Status | Porta | Health Check |
|---------|--------|-------|--------------|
| Frontend Next.js | Running | 3100 | ✅ Healthy |
| Backend NestJS | Running | 3101 | ✅ Healthy |
| API Service | Running | 8000 | ✅ Healthy |
| PostgreSQL | Running | 5532 | ✅ Healthy |
| Redis | Running | 6479 | ✅ Healthy |
| Scrapers (VNC) | Running | 6080 | ✅ Healthy |
| Orchestrator | Running | - | ✅ Healthy |

### Migration Notes

Se você está atualizando de uma versão anterior:

1. **Atualizar Variáveis de Ambiente**
   ```bash
   # Verificar se NEXT_PUBLIC_API_URL tem /v1 no final
   NEXT_PUBLIC_API_URL=http://localhost:3101/api/v1

   # Verificar Google OAuth callback URL
   GOOGLE_CALLBACK_URL=http://localhost:3101/api/v1/auth/google/callback
   ```

2. **Recriar Containers Frontend**
   ```bash
   # Variáveis NEXT_PUBLIC_* exigem rebuild
   docker-compose down frontend
   docker-compose up -d frontend
   ```

3. **Verificar Health dos Containers**
   ```bash
   docker ps
   # Todos devem mostrar (healthy)
   ```

### Known Issues

Nenhum issue conhecido nesta versão. Sistema 100% operacional.

### Contributors

- Claude Code (Anthropic) - Correções OAuth, documentação, e estabilização do sistema

---

## [1.0.0] - 2024-XX-XX

### Initial Release
- Sistema inicial de análise de ativos da B3
- Integração com múltiplos scrapers OAuth
- Dashboard de visualização de ativos
- Sistema de autenticação básico

---

[1.1.0]: https://github.com/seu-usuario/invest-claude-web/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/seu-usuario/invest-claude-web/releases/tag/v1.0.0
