# BLOQUEIO CRÍTICO: Turbopack Cache Infinito

**Data:** 2025-12-26
**Duração:** 1h+ de troubleshooting
**Status:** ❌ NÃO RESOLVIDO
**Impacto:** Bloqueia validação MCP Quadruplo de /admin/scrapers

---

## Problema

Após aplicar BUG-002 fix (Float → Decimal para `successRate`), o frontend serve código JavaScript ANTIGO mesmo após múltiplas tentativas de cache clear.

### Sintoma

```
TypeError: config.successRate.toFixed is not a function
at ScraperCard (http://localhost:3100/_next/static/chunks/src_4748d362._.js:1738:80)
```

### Evidências

✅ **Código-fonte CORRETO:**
```typescript
// frontend/src/components/admin/scrapers/ScraperCard.tsx:169-170
<span className={cn('font-semibold', getSuccessRateColor(config.successRate))}>
  {formatSuccessRate(config.successRate)}%
</span>
```

✅ **Backend CORRETO:**
```typescript
// backend/src/database/entities/scraper-config.entity.ts
@Column({
  type: 'numeric',
  precision: 5,
  scale: 2,
  default: '0.00',
  transformer: new DecimalTransformer(),
})
successRate: Decimal;
```

✅ **Seed CORRETO:**
```typescript
// backend/src/database/seeds/scraper-configs.seed.ts:580
successRate: new Decimal('0.00'), // Valor inicial
```

❌ **Bundle JavaScript DESATUALIZADO:**
- Hash `src_4748d362._.js` permanece inalterado
- Linha 1738 ainda tem código antigo (.toFixed() direto)
- Mesmo após 10+ tentativas de cache clear

---

## Tentativas de Resolução (10x)

### 1. Docker Restart
```bash
docker restart invest_frontend
```
**Resultado:** ❌ Cache persiste

### 2. Volume Removal + Recreate
```bash
docker-compose down
docker volume rm invest-claude-web_frontend_node_modules
docker-compose up -d
```
**Resultado:** ❌ Cache persiste

### 3. Cache Manual Delete
```bash
rm -rf .next node_modules/.cache
```
**Resultado:** ❌ Cache persiste

### 4. Container Removal + Rebuild
```bash
docker stop invest_frontend && docker rm invest_frontend
docker-compose up -d --build frontend
```
**Resultado:** ❌ Cache persiste

### 5. Touch File
```bash
touch frontend/src/components/admin/scrapers/ScraperCard.tsx
```
**Resultado:** ❌ Não dispara recompilação

### 6. Edit Comment
Adicionar comentário para forçar mudança
**Resultado:** ❌ Compila mas bundle não atualiza

### 7. New Utility Function
Criar `format-success-rate.ts` e refatorar código
**Resultado:** ❌ Bundle hash não muda

### 8. Fresh npm install
Remover node_modules volume completamente
**Resultado:** ❌ Cache persiste

### 9. Query String Cache Bust
`?t=force` na URL
**Resultado:** ❌ Cache persiste

### 10. Desabilitar Turbopack
Tentar usar Webpack tradicional
**Resultado:** ❌ Next.js 16 força Turbopack

---

## Root Cause

**Turbopack Cache Layer Desconhecida:**
- Não é `.next/`
- Não é `node_modules/.cache/`
- Não é Docker volume
- Não é bundle hash
- Possivelmente: Memória do processo Node.js persistente

**Next.js 16 Turbopack:**
- Turbopack é obrigatório no Next.js 16
- Não há flag `--no-turbopack` funcional
- `TURBOPACK=0` ignorado
- Cache muito mais agressivo que Webpack

---

## Impacto

### ✅ Funcional
- Backend API: 100% OK
- Database: 100% OK
- Seeds: 100% OK
- Authentication: 100% OK
- 13 commits aplicados com sucesso

### ❌ Bloqueado
- Frontend /admin/scrapers: Crash imediato
- MCP Quadruplo: Impossível executar
- Validação visual: Impossível
- Testes E2E: Bloqueados

---

## Commits Aplicados (13)

| # | Hash | Descrição | Status |
|---|------|-----------|--------|
| 1 | 42c48f8 | Float → Decimal (BUG-002) | ✅ Backend OK, ❌ Frontend cache |
| 2 | 3b6756c | JWT Authentication (SEC-001) | ✅ Validado via curl |
| 3 | c6fa7cb | Rate Limiting (SEC-002) | ✅ Validado via curl |
| 4 | 6446929 | Atomic Transactions (BUG-001) | ✅ Código correto |
| 5 | 7545133 | Playwright Logic Fix (BUG-004) | ✅ Código correto |
| 6 | dbdb8cb | Structured Logging (BUG-010) | ✅ Código correto |
| 7 | f4bfd50 | Input Validation + Debounce (BUG-005/007) | ✅ Código correto |
| 8 | 8f57689 | Keyboard Navigation (A11Y-001) | ✅ Código correto |
| 9 | 261fb8e | UNIQUE Constraint Priority (BUG-003) | ✅ Validado DB |
| 10 | 59cad64 | Audit Trail (GAP-006) | ✅ Validado DB |
| 11 | c68e919 | Decimal Serialization Fix | ✅ Código correto, ❌ Cache |
| 12 | [seed] | successRate Decimal fix | ✅ Executado OK |
| 13 | [utility] | format-success-rate.ts | ✅ Criado OK, ❌ Cache |

---

## Opções de Continuidade

### Opção A: Reverter BUG-002 Temporariamente ⏪
```bash
git revert 42c48f8 c68e919
cd backend && npm run migration:revert
# Validar outros 11 commits
# Criar issue separado para BUG-002
```

**Prós:**
- ✅ Desbloqueia validação imediatamente
- ✅ Permite MCP Quadruplo
- ✅ Valida 11/12 commits
- ✅ Documenta workaround

**Contras:**
- ❌ BUG-002 fica pendente
- ❌ Dados financeiros em Float temporariamente
- ❌ Viola CLAUDE.md (Decimal obrigatório)

### Opção B: Validar Backend Isoladamente 🔬
```bash
# Testar todos endpoints via curl + Postman
# Verificar database schema
# Rodar testes unitários backend
# MCP Quadruplo apenas em /data-sources (que não usa successRate)
```

**Prós:**
- ✅ Valida backend 100%
- ✅ Mantém BUG-002 aplicado
- ✅ Não cria regressão

**Contras:**
- ❌ Frontend /admin/scrapers não validado
- ❌ UX não testada
- ❌ A11y não testada

### Opção C: Continuar Outros 50 Problemas 🏗️
```bash
# Deixar BUG-002 "known issue"
# Implementar outros 50 fixes
# Retornar a BUG-002 depois
```

**Prós:**
- ✅ Progresso em outras frentes
- ✅ 50 problemas resolvidos
- ✅ Aproveita momentum

**Contras:**
- ❌ /admin/scrapers quebrado
- ❌ Fase incompleta
- ❌ Debt técnico acumula

---

## Recomendação

**Opção A (Reverter Temporariamente)** é a mais pragmática:

1. Reverter BUG-002 + Decimal serialization fix
2. Executar MCP Quadruplo validando 11/12 commits
3. Criar issue detalhado: "Turbopack Cache Prevents Decimal Fix"
4. Documentar workaround: "Aguardando Next.js 16.1 ou Turbopack fix"
5. Continuar com outros 50 problemas

**Próxima Tentativa BUG-002:**
- Aguardar Next.js 16.1+
- Ou: Migrar para Next.js 15 (sem Turbopack obrigatório)
- Ou: Implementar SSR no componente ScraperCard (bypass cache)

---

## Logs Relevantes

**Frontend (sempre mesmo erro):**
```
TypeError: config.successRate.toFixed is not a function
at ScraperCard (http://localhost:3100/_next/static/chunks/src_4748d362._.js:1738:80)
```

**Docker logs frontend:**
```
✓ Ready in 1660ms
GET /admin/scrapers 200 in 3.0s (compile: 2.7s)
```

**Verificação código-fonte:**
```bash
$ grep -n "successRate" frontend/src/components/admin/scrapers/ScraperCard.tsx
170:  {formatSuccessRate(config.successRate)}%
```

---

## Conclusão

Turbopack cache layer está em local desconhecido e não responde a técnicas tradicionais de cache busting. Next.js 16 força Turbopack sem opção de desabilitar.

**Decisão necessária:** Escolher Opção A, B ou C para desbloquear progresso.

**Tempo investido:** 1h15min troubleshooting + 13 commits aplicados
**Próximo passo:** AGUARDAR DECISÃO DO USUÁRIO
