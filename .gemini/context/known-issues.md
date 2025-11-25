# Known Issues and Solutions - B3 AI Analysis Platform

**Versão:** 1.0  
**Última Atualização:** 2025-11-24  
**Projeto:** invest-claude-web

---

## Sobre este Documento

Este arquivo centraliza **todos os problemas conhecidos** encontrados durante o desenvolvimento do projeto, suas causas raiz, soluções aplicadas e lições aprendidas. É uma referência essencial para:

- ✅ Evitar repetir erros
- ✅ Diagnosticar problemas rapidamente
- ✅ Entender decisões técnicas
- ✅ Treinar novos desenvolvedores

---

## Issue #1: Incorrect Login Selectors (OpcoesScraper)

**Severidade:** 🔴 Alta  
**Componente:** Backend - Scraper  
**Data:** 2025-11-24  
**Status:** ✅ Resolvido

### Problema

- `OpcoesScraper.login()` falhava com erro "Waiting for selector... failed"
- Login em `opcoes.net.br` não funcionava
- Scraper não conseguia acessar dados de liquidez

### Root Cause

- Seletores CSS genéricos não correspondiam ao HTML real da página
- Página de login usa IDs específicos: `#CPF` e `#Password`
- Código original tentava usar `input[name="cpf"]` que não existe

### Solução

```typescript
// ❌ ANTES (incorreto)
await page.waitForSelector('input[name="cpf"]', { timeout: 10000 });
await page.type('input[name="cpf"]', cpf);
await page.type('input[name="password"]', password);

// ✅ DEPOIS (correto)
await page.waitForSelector("#CPF", { timeout: 10000 });
await page.type("#CPF", cpf);
await page.type("#Password", password);
await page.click('button[type="submit"]');
```

### Lição Aprendida

- Sempre inspecionar o HTML real da página antes de escrever seletores
- Usar IDs quando disponíveis (mais estáveis que classes ou nomes)
- Adicionar logs detalhados em cada etapa do scraper
- Testar login isoladamente antes de integrar com scraping

### Arquivos Modificados

- `backend/src/scrapers/options/opcoes.scraper.ts`

### Commit

`40c7654` - feat(assets): add options liquidity column and filter

---

## Issue #2: Pagination Only Scraping First Page

**Severidade:** 🔴 Alta  
**Componente:** Backend - Scraper  
**Data:** 2025-11-24  
**Status:** ✅ Resolvido

### Problema

- Scraper coletava apenas 25 assets (primeira página)
- Esperado: ~194 assets distribuídos em 7 páginas
- Nenhum erro exibido, simplesmente parava após página 1

### Root Cause

- Método `scrapeLiquidity()` não tinha lógica de paginação
- Código scraped apenas a tabela visível inicialmente
- Não havia loop para navegar entre páginas

### Solução

Implementação de paginação multi-estratégia:

```typescript
let pageNum = 1;
let hasNextPage = true;
const allTickers = new Set<string>();

while (hasNextPage) {
  this.logger.log(`Scraping page ${pageNum}...`);

  // Extrair tickers da página atual
  const rows = await this.page.$$("table tbody tr");
  for (const row of rows) {
    const ticker = await row.$eval("td:first-child", (el) =>
      el.textContent?.trim()
    );
    if (ticker) allTickers.add(ticker);
  }

  // Tentar botão "Next" padrão
  let nextButton = await this.page.$(
    "button.dt-paging-button.next:not(.disabled)"
  );

  if (nextButton) {
    await nextButton.click();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    pageNum++;
  } else {
    // Fallback: DOM evaluation para encontrar próxima página
    const moved = await this.page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll("button.dt-paging-button")
      );
      const current = document.querySelector("button.dt-paging-button.current");
      if (current) {
        const currentIndex = buttons.indexOf(current as HTMLButtonElement);
        if (currentIndex >= 0 && currentIndex < buttons.length - 1) {
          const next = buttons[currentIndex + 1];
          if (next && !next.classList.contains("disabled")) {
            (next as HTMLElement).click();
            return true;
          }
        }
      }
      return false;
    });

    if (moved) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      pageNum++;
    } else {
      hasNextPage = false;
    }
  }
}

return Array.from(allTickers);
```

### Resultado

- ✅ 174 unique tickers scraped (7 páginas completas)
- ✅ Logs confirmando cada página: "Scraping page X..."
- ✅ Detecção automática quando não há mais páginas

### Lição Aprendida

- Sempre implementar paginação desde o início
- Usar múltiplas estratégias para encontrar botão "Next"
- Adicionar logging detalhado (página atual, total de itens)
- Aguardar tempo suficiente após clicar (evitar race conditions)
- Testar com site real, não apenas primeira página

### Arquivos Modificados

- `backend/src/scrapers/options/opcoes.scraper.ts`

### Commit

`40c7654` - feat(assets): add options liquidity column and filter

---

## Issue #3: TypeScript Error on Element Click

**Severidade:** 🟡 Média  
**Componente:** Backend - Scraper  
**Data:** 2025-11-24  
**Status:** ✅ Resolvido

### Problema

```
Property 'click' does not exist on type 'Element'
```

### Root Cause

- `page.$()` do Puppeteer retorna `Element | null`
- Interface `Element` não tem método `click()`
- TypeScript strict mode detectou tipo incorreto

### Solução

```typescript
// ❌ ERRADO
const nextButton = await page.$("button.next");
await nextButton.click(); // Erro: Property 'click' does not exist

// ✅ CORRETO (opção 1: type assertion)
const nextButton = await page.$("button.next");
if (nextButton) {
  await(nextButton as any as HTMLElement).click();
}

// ✅ CORRETO (opção 2: page.evaluate - mais seguro)
await page.evaluate(() => {
  const button = document.querySelector("button.next");
  if (button) {
    (button as HTMLElement).click();
  }
});

// ✅ CORRETO (opção 3: page.click)
await page.click("button.next");
```

### Lição Aprendida

- Preferir `page.click(selector)` quando possível (mais simples)
- `page.evaluate()` é type-safe e roda no contexto do browser
- Evitar `as any` quando houver alternativa melhor
- TypeScript strict mode ajuda a encontrar bugs antes do runtime

### Arquivos Modificados

- `backend/src/scrapers/options/opcoes.scraper.ts`

### Commit

`40c7654` - feat(assets): add options liquidity column and filter

---

## Issue #4: Frontend Changes Not Visible in Browser

**Severidade:** 🔴 Crítica  
**Componente:** Frontend - Docker + Next.js  
**Data:** 2025-11-24  
**Status:** ⚠️ Parcialmente Resolvido

### Problema

- Mudanças em `asset-table.tsx` e `page.tsx` presentes no filesystem
- `docker exec invest_frontend cat src/components/dashboard/asset-table.tsx` mostra conteúdo ANTIGO
- Browser continua exibindo UI sem coluna "Opções"
- Múltiplos `docker restart invest_frontend` não tiveram efeito

### Root Cause

- Volume Docker `frontend_next` cacheia artefatos do build `.next`
- Configuração de volume mount leva a sincronização inconsistente de arquivos
- Next.js hot reload não detecta mudanças dentro do container
- Build artifacts sobrescrevem código fonte montado

### Tentativas Fracassadas

1. ❌ `docker restart invest_frontend` - Sem efeito
2. ❌ `docker exec invest_frontend rm -rf .next` - Falha (resource busy)
3. ❌ `docker-compose up -d --force-recreate frontend` - Sem efeito
4. ❌ `docker-compose down -v && up --build` - **APAGOU O BANCO DE DADOS INTEIRO**

### Solução Correta

```bash
# 1. Parar APENAS o frontend
docker stop invest_frontend

# 2. Remover volume ESPECÍFICO do cache Next.js
docker volume rm invest-claude-web_frontend_next

# 3. Reiniciar frontend com rebuild
docker-compose up -d --build frontend

# 4. Verificar logs para confirmar rebuild
docker logs invest_frontend --tail 50
```

### Solução de Prevenção

Adicionar ao `docker-compose.yml`:

```yaml
frontend:
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules
    # Não persistir .next (ou limpar regularmente)
    # - frontend_next:/app/.next  # REMOVER ESTA LINHA
  environment:
    - CHOKIDAR_USEPOLLING=true # Melhor detecção de mudanças
```

### Critical Lesson

> [!CAUTION] > **NUNCA use `docker-compose down -v`** para resolver problemas de cache de frontend!
>
> Este comando remove **TODOS os volumes**, incluindo `postgres_data`, causando perda total de dados.

### Lição Aprendida

- Entender escopo de cada volume Docker (dados vs cache vs deps)
- Usar comandos targeted ao invés de destrutivos
- Documentar qual volume é crítico vs descartável
- Considerar builds sem cache persistente para dev
- Testar mudanças de UI rapidamente (não esperar acumular)

### Status Atual

⚠️ Frontend ainda exibindo build antigo (aguardando ação do usuário para limpar volume)

### Arquivos Afetados

- Nenhum (problema de infraestrutura, não código)

---

## Issue #5: Database Wiped by `down -v`

**Severidade:** 🔴 Crítica  
**Componente:** Infraestrutura - Docker  
**Data:** 2025-11-24  
**Status:** ⚠️ Recuperação Parcial

### Problema

- Executado `docker-compose down -v` para limpar cache do frontend
- Perdeu **TODOS** os dados do banco de dados:
  - 55 assets sincronizados
  - 48 assets com `hasOptions=true` corretamente populados
  - Todos os usuários, preços históricos, análises, etc.

### Root Cause

- Comando `down -v` remove **TODOS os volumes nomeados**
- Volume `postgres_data` foi destruído junto com `frontend_next`
- Não compreendeu escopo do flag `-v`
- Não havia backup recente

### Impacto

```
ANTES:  55 assets, 48 com hasOptions=true, dados completos
DEPOIS: 0 assets, banco vazio, apenas schema
```

### Ações de Recuperação

1. ✅ `docker-compose up -d --build` - Recriar containers
2. ✅ `npm run migration:run` - Reaplicar schema (colunas existem)
3. ✅ `npm run seed` - Recriar usuário admin
4. ❌ **Dados de assets ainda vazios** (precisa re-sync manual)

### Solução de Prevenção

**1. Backup Automático**

Criar script de backup diário:

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker exec invest_postgres pg_dump -U invest_user invest_db > backups/backup_$DATE.sql
echo "Backup criado: backups/backup_$DATE.sql"
```

**2. Volumes Documentados**

```yaml
volumes:
  postgres_data: # 🔴 CRÍTICO - Nunca remover
  redis_data: # 🟡 Cache - Pode recriar
  frontend_next: # 🟢 Build - Pode limpar
  backend_node_modules: # 🟢 Deps - Pode reinstalar
```

**3. Comandos Safe**

```bash
# ❌ NUNCA USAR
docker-compose down -v  # Remove TUDO

# ✅ USAR SEMPRE
docker stop invest_frontend
docker volume rm invest-claude-web_frontend_next
docker-compose up -d frontend
```

### Lição Aprendida

- **Backup antes de qualquer operação destrutiva**
- Entender o que cada flag faz (`-v` = volumes, **TODOS**)
- Documentar volumes críticos vs descartáveis
- Testar comandos destrutivos em ambiente de teste primeiro
- Usar volumes named e inspecioná-los antes de remover

### Procedimento de Recuperação

Se isso acontecer novamente:

```bash
# 1. Restaurar do backup (se existir)
cat backups/backup_YYYYMMDD.sql | docker exec -i invest_postgres psql -U invest_user invest_db

# 2. Se não tiver backup, recriar do zero
docker exec invest_backend npm run migration:run
docker exec invest_backend npm run seed

# 3. Re-sincronizar assets via UI
# http://localhost:3100/assets -> "Atualizar Todos"
```

### Status Atual

⚠️ Banco vazio, aguardando re-população de dados

---

## Issue #6: JWT Authentication Errors During Testing

**Severidade:** 🟡 Média  
**Componente:** Backend - Auth  
**Data:** 2025-11-24  
**Status:** ✅ Resolvido

### Problema

```
401 Unauthorized
{"message":"User not found or inactive","error":"Unauthorized"}
```

### Root Cause

- Token JWT expirou após database wipe
- Script `login.js` estava usando token cacheado em `token.txt`
- Endpoint `POST /assets/sync-options-liquidity` requer JWT válido

### Solução

```bash
# Fazer login fresh para obter novo token
node login.js

# Token salvo automaticamente em token.txt
# Agora pode usar outros scripts
node trigger_sync.js
```

### Lição Aprendida

- Tokens devem ser regenerados após reset de DB
- Scripts devem ter mecanismo de refresh automático
- Adicionar tratamento de erro 401 = "Token expirado, faça login"

### Arquivos Envolvidos

- `login.js`
- `trigger_sync.js`
- `token.txt` (gerado)

---

## Issue #7: Sync Reporting 0 Updates

**Severidade:** 🟢 Baixa (comportamento esperado)  
**Componente:** Backend - Service  
**Data:** 2025-11-24  
**Status:** ✅ Comportamento Normal

### Problema

```
[AssetsService] Updated 0 assets with options liquidity info
```

### Root Cause

- Banco de dados vazio (0 assets)
- `syncOptionsLiquidity()` funciona corretamente mas não tem nada para atualizar
- Precisa popular assets base primeiro

### Solução

1. Popular assets via UI "Atualizar Todos" **OU**
2. Rodar seed script com assets **OU**
3. Triggerar full asset sync via API

```bash
# Via UI (recomendado)
# http://localhost:3100/assets -> Clicar "Atualizar Todos"

# Via script
node verify_assets.js  # Verificar quantos assets existem
node trigger_sync.js   # Sync options liquidity
```

### Lição Aprendida

- Verificar pré-condições antes de rodar sync
- Adicionar warning se asset count = 0
- Logs devem ser claros sobre o que está acontecendo

---

## Issue #8: Migration Already Applied Error

**Severidade:** 🟡 Média  
**Componente:** Backend - Migrations  
**Data:** 2025-11-24  
**Status:** ✅ Resolvido

### Problema

```
Error during migration:run
relation "users" already exists
```

### Root Cause

- Database não foi completamente wipado
- Algumas migrations persistiram após `down -v`
- Tentativa de re-executar migrations já aplicadas

### Solução

```bash
# Verificar migrations aplicadas
docker exec invest_postgres psql -U invest_user invest_db -c "SELECT * FROM migrations;"

# Verificar schema atual
docker exec invest_postgres psql -U invest_user invest_db -c "\d assets"

# Se colunas já existem, skip migration
# Se inconsistente, limpar migrations table (DEV ONLY!)
```

### Lição Aprendida

- Verificar estado atual antes de rodar migrations
- Migrations devem ser idempotentes quando possível
- Documentar quais migrations são críticas

### Status

✅ Colunas `has_options` e `options_liquidity_metadata` existem, migration não é crítica

---

## Lessons Learned - Resumo

### Docker Volume Management

1. **Entender escopo de volumes**:

   ```yaml
   volumes:
     postgres_data: # Dados persistentes (backup!)
     frontend_next: # Cache de build (pode limpar)
     backend_node_modules: # Dependências (reinstalável)
   ```

2. **Limpeza targeted**:

   ```bash
   # ✅ Remove APENAS cache frontend
   docker volume rm invest-claude-web_frontend_next

   # ❌ Remove TUDO (incluindo DB)
   docker-compose down -v
   ```

3. **Verificar antes de destruir**:
   ```bash
   docker volume ls
   docker volume inspect invest-claude-web_postgres_data
   ```

### Scraper Development

1. ✅ Sempre implementar paginação desde o início
2. ✅ Adicionar logging detalhado em cada etapa
3. ✅ Usar múltiplas estratégias de seletores (sites mudam)
4. ✅ Testar com navegação real, não só primeira página
5. ✅ Validar HTML real da página antes de escrever código

### Frontend Development in Docker

1. ✅ Hot reload é não-confiável em volumes Docker
2. ✅ Rebuild explícito após mudanças:
   ```bash
   docker-compose up -d --build frontend
   ```
3. ✅ Limpar cache `.next` quando houver dúvida
4. ✅ Verificar conteúdo dentro do container antes de debugar código
5. ✅ Considerar CHOKIDAR_USEPOLLING=true para melhor detecção

### Database Operations

1. ✅ **SEMPRE backup** antes de operações destrutivas
2. ✅ Testar migrations em dev primeiro
3. ✅ Documentar seed data para recuperação rápida
4. ✅ Separar databases de test/dev de dados críticos
5. ✅ Usar transactions para operações batch

---

## Prevention Checklist

Antes de executar comandos potencialmente destrutivos:

- [ ] Backup do database criado (ou confirmado vazio/test data)
- [ ] Entender quais volumes serão afetados
- [ ] Tentar solução targeted primeiro
- [ ] Plano de recuperação documentado
- [ ] Commit/push de mudanças de código antes de mudanças de infra

---

## Recovery Procedures

### Frontend Not Updating

```bash
# 1. Parar frontend
docker stop invest_frontend

# 2. Limpar cache Next.js (volume específico)
docker volume rm invest-claude-web_frontend_next

# 3. Reiniciar com rebuild
docker-compose up -d --build frontend

# 4. Verificar logs
docker logs invest_frontend --tail 50
```

### Lost Database Data

```bash
# 1. Recriar containers
docker-compose up -d --build

# 2. Executar migrations
docker exec invest_backend npm run migration:run

# 3. Seed base data
docker exec invest_backend npm run seed

# 4. Sync assets (via UI ou API)
# http://localhost:3100/assets -> "Atualizar Todos"
```

### Scraper Not Finding All Data

```bash
# 1. Verificar logs do scraper
docker logs invest_backend --tail 200 | grep OpcoesScraper

# 2. Verificar lógica de paginação
# Procurar por "Scraping page X..." messages

# 3. Verificar contagem final
# Procurar por "Found X unique tickers with liquid options"

# 4. Validar manualmente em opcoes.net.br
# https://opcoes.net.br/estudos/liquidez/opcoes
```

---

## Métricas de Problemas

| Issue               | Severidade | Tempo para Fix      | Impacto     | Status       |
| ------------------- | ---------- | ------------------- | ----------- | ------------ |
| #1 Login Selectors  | 🔴 Alta    | 30 min              | Alto        | ✅ Resolvido |
| #2 Pagination       | 🔴 Alta    | 2 horas             | Alto        | ✅ Resolvido |
| #3 TypeScript Error | 🟡 Média   | 15 min              | Baixo       | ✅ Resolvido |
| #4 Frontend Cache   | 🔴 Crítica | Pendente            | Alto        | ⚠️ Parcial   |
| #5 Database Wiped   | 🔴 Crítica | Recuperação parcial | **Crítico** | ⚠️ Parcial   |
| #6 JWT Errors       | 🟡 Média   | 10 min              | Médio       | ✅ Resolvido |
| #7 Sync 0 Updates   | 🟢 Baixa   | N/A                 | Nenhum      | ✅ Normal    |
| #8 Migration Error  | 🟡 Média   | 20 min              | Baixo       | ✅ Resolvido |

**Total de Issues Críticos**: 2  
**Total de Issues Resolvidos**: 6/8 (75%)  
**Lições Aprendidas Documentadas**: 15+

---

## Referências

- Implementation Plan: `.gemini/antigravity/brain/[id]/implementation_plan.md`
- Walkthrough: `.gemini/antigravity/brain/[id]/walkthrough.md`
- Task List: `.gemini/antigravity/brain/[id]/task.md`
- Docker Compose: `docker-compose.yml`
- System Manager: `system-manager.ps1`

---

**Última Revisão:** 2025-11-24  
**Próxima Revisão:** Após resolução dos issues pendentes
