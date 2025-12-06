# PLANO DE TROUBLESHOOTING - GAPS IDENTIFICADOS

**Data:** 2025-12-05
**Versao:** 1.1
**Status:** EM EXECUCAO

---

## NOTA TECNICA: MIGRACAO SELENIUM -> PLAYWRIGHT

> **IMPORTANTE:** O projeto foi migrado de Selenium para Playwright em 2025-12-03.
> - Todos os scrapers agora usam Playwright (async)
> - O OAuth Session Manager (`oauth_session_manager.py`) ja foi migrado
> - Nao usar mais scripts que referenciam Selenium
> - A API OAuth esta disponivel em `http://localhost:8080/api/oauth/`

---

## SUMARIO EXECUTIVO

| Gap | Prioridade | Estimativa | Dependencia |
|-----|------------|------------|-------------|
| Gap 1: Fundamentei Scraper 50% failure | ALTA | 2-3h | Nenhuma |
| Gap 2: 789 Assets Sync Parcial | MEDIA | 4-6h | Gap 1 |
| Gap 3: 6.276 Alertas de Qualidade | MEDIA | 2-3h | Nenhuma |
| Gap 4: 18 Assets Pendentes | BAIXA | 1h | Gap 1 |
| Gap 5: Acessibilidade Form Fields | BAIXA | 1-2h | Nenhuma |

**Tempo Total Estimado:** 10-15 horas

---

## GAP 1: FUNDAMENTEI SCRAPER (50% FAILURE RATE)

### Causa Raiz Identificada

**ARQUIVO DE COOKIES NAO EXISTE!**

```bash
# Verificacao realizada:
docker exec invest_scrapers ls -la /app/data/cookies/

# Resultado:
-rw-r--r-- 1 root root   0 Dec  4 23:49 chatgpt_session.json  # VAZIO
-rw-r--r-- 1 root root   0 Dec  4 23:49 test.txt              # VAZIO
# FALTA: fundamentei_session.json
```

O scraper `fundamentei_scraper.py` (linha 34) espera:
```python
COOKIES_FILE = "/app/data/cookies/fundamentei_session.json"
```

### Plano de Acao

#### Fase 1.1: Gerar Cookies do Fundamentei via OAuth API (30 min)

**Metodo Recomendado: API OAuth + VNC (Playwright)**

```bash
# 1. Verificar se API OAuth esta rodando
curl -s http://localhost:8000/api/oauth/health

# 2. Iniciar sessao OAuth (abre browser via Playwright)
curl -X POST http://localhost:8000/api/oauth/session/start

# 3. Acessar noVNC para fazer login manual
# URL: http://localhost:6080/vnc.html

# 4. Seguir fluxo no browser VNC:
#    a) Login no Google primeiro (site 1)
#    b) Confirmar via API: curl -X POST http://localhost:8000/api/oauth/session/confirm-login
#    c) Login no Fundamentei (site 2) - clica automatico no botao Google
#    d) Confirmar via API: curl -X POST http://localhost:8000/api/oauth/session/confirm-login
#    e) Pular sites nao necessarios: curl -X POST http://localhost:8000/api/oauth/session/skip-site

# 5. Salvar cookies quando terminar sites importantes
curl -X POST http://localhost:8000/api/oauth/session/save

# 6. Verificar status a qualquer momento
curl -s http://localhost:8000/api/oauth/session/status | jq '.'
```

**Metodo Alternativo: Script Direto (Legado - usa Selenium)**

```bash
# NAO RECOMENDADO - script usa Selenium (deprecado)
# docker exec -it invest_scrapers python save_google_cookies.py fundamentei
```

#### Fase 1.2: Validar Cookies Gerados (15 min)

```bash
# Verificar se arquivo foi criado
docker exec invest_scrapers ls -la /app/data/cookies/fundamentei_session.json

# Verificar conteudo (deve ter cookies validos)
docker exec invest_scrapers cat /app/data/cookies/fundamentei_session.json | head -50

# Verificar se tem cookies fundamentei
docker exec invest_scrapers python -c "
import json
with open('/app/data/cookies/fundamentei_session.json') as f:
    data = json.load(f)
cookies = data if isinstance(data, list) else data.get('cookies', [])
fundamentei_cookies = [c for c in cookies if 'fundamentei' in c.get('domain', '')]
print(f'Total cookies: {len(cookies)}')
print(f'Fundamentei cookies: {len(fundamentei_cookies)}')
for c in fundamentei_cookies[:5]:
    print(f'  - {c.get(\"name\")}: {c.get(\"domain\")}')
"
```

#### Fase 1.3: Testar Scraper (30 min)

```bash
# Teste individual
docker exec invest_scrapers python -c "
import asyncio
from scrapers.fundamentei_scraper import FundamenteiScraper

async def test():
    scraper = FundamenteiScraper()
    try:
        await scraper.initialize()
        result = await scraper.scrape('PETR4')
        print(f'Success: {result.success}')
        if result.success:
            print(f'Data: {result.data}')
        else:
            print(f'Error: {result.error}')
    finally:
        await scraper.cleanup()

asyncio.run(test())
"

# Teste com multiplos tickers
docker exec invest_scrapers python -c "
import asyncio
from scrapers.fundamentei_scraper import FundamenteiScraper

async def test_multiple():
    tickers = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3']
    scraper = FundamenteiScraper()
    success_count = 0

    try:
        await scraper.initialize()
        for ticker in tickers:
            result = await scraper.scrape(ticker)
            status = '✅' if result.success else '❌'
            print(f'{status} {ticker}: {result.success}')
            if result.success:
                success_count += 1
    finally:
        await scraper.cleanup()

    print(f'\nSuccess rate: {success_count}/{len(tickers)} ({100*success_count/len(tickers):.0f}%)')

asyncio.run(test_multiple())
"
```

#### Fase 1.4: Verificar Estrutura HTML (Se ainda falhar) (1h)

Se apos cookies o scraper ainda falhar, pode ser problema de estrutura HTML:

```bash
# Executar debug script
docker exec invest_scrapers python debug_fundamentei4.py

# Analisar HTML salvo
docker exec invest_scrapers cat /app/debug_fundamentei.html | head -200

# Verificar se estrutura H2/H4 ainda existe
docker exec invest_scrapers python -c "
from bs4 import BeautifulSoup

with open('/app/debug_fundamentei.html') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Verificar padrao H2 (nome indicador) + H4 (valor)
h2_elements = soup.select('h2')
print(f'H2 elements found: {len(h2_elements)}')
for h2 in h2_elements[:10]:
    parent = h2.parent
    h4 = parent.select_one('h4') if parent else None
    h2_text = h2.get_text(strip=True)[:30]
    h4_text = h4.get_text(strip=True)[:20] if h4 else 'N/A'
    print(f'  H2: {h2_text} -> H4: {h4_text}')
"
```

### Criterios de Sucesso Gap 1
- [x] Arquivo `fundamentei_session.json` existe e tem cookies validos ✅ (10 cookies)
- [x] Scraper retorna `success=True` para PETR4 ✅
- [x] Success rate >= 80% em teste com 5 tickers ✅ (100% - 5/5)
- [x] Indicadores P/L, P/VP extraidos corretamente ✅ (ROE nao disponivel na pagina)

**GAP 1 RESOLVIDO em 2025-12-05** - Causa raiz: cookies faltando. Solucao: OAuth login via VNC.

---

## GAP 2: 192 ASSETS COM LOW CONFIDENCE (Atualizado 2025-12-05)

### Causa Raiz Corrigida

**NAO é falta de dados historicos.** O problema real:
- 192 assets tem `lastUpdateStatus: failed`
- Causa: "Low confidence" (< 0.5) durante cross-validation
- Scrapers TypeScript retornando dados divergentes

### Analise Detalhada (2025-12-05)

| Tipo de Erro | Quantidade | Causa |
|--------------|------------|-------|
| Low confidence 0.23 | 89 | Apenas 1 fonte de 3+ reportou |
| Low confidence 0.33 | 56 | 1 de 3 fontes concordam |
| Insufficient sources | 28 | < 2 scrapers retornaram dados |
| Outros | 19 | Variações de confidence |

### Scrapers TypeScript (Todos Funcionando)

| Scraper | Status | Tempo |
|---------|--------|-------|
| fundamentus | ✅ | 7.8s |
| brapi | ✅ | 12.4s |
| statusinvest | ✅ | 57.9s |
| investidor10 | ✅ | 32.6s |
| fundamentei | ✅ | 6.2s |
| investsite | ✅ | 10.2s |

### Assets Prioritarios (14 com opcoes)

```
ALUP11, BBAS3, BBDC3, BPAC11, ENEV3, ENGI11, HYPE3,
IBOV11, IGTI11, KLBN11, PETZ3, SAPR11, TAEE11, TASA4
```

### Teste de Re-sync Bem Sucedido

BBAS3 re-sync via `/populate`:
- Antes: confidence 0.33 (FAILED)
- Depois: confidence 0.58 (SUCCESS)
- Fontes: 5/6 (brapi, statusinvest, investidor10, fundamentei, investsite)

### Plano de Acao Atualizado

#### Fase 2.1: Re-sync Assets Prioritarios (1-2h)

```bash
# Re-populate os 14 assets com opcoes que falharam
for ticker in ALUP11 BBAS3 BBDC3 BPAC11 ENEV3 ENGI11 HYPE3 IBOV11 IGTI11 KLBN11 PETZ3 SAPR11 TAEE11 TASA4; do
  echo "Processing $ticker..."
  curl -s -X POST "http://localhost:3101/api/v1/assets/$ticker/populate"
  sleep 5
done
```

#### Fase 2.2: Validar Resultados

```bash
# Verificar se confidence melhorou
curl -s "http://localhost:3101/api/v1/assets/BBAS3/data-sources"

# Verificar fundamental data salvo
curl -s "http://localhost:3101/api/v1/assets/BBAS3" | grep -E "lastUpdateStatus|confidence"
```

#### Fase 2.3: Bulk Re-sync (Opcional)

Se necessario re-sync de todos 192 assets:
```bash
# Via authenticated endpoint (requer JWT)
curl -X POST "http://localhost:3101/api/v1/assets/sync-all" \
  -H "Authorization: Bearer <token>"
```

### Criterios de Sucesso Gap 2
- [x] Scrapers TypeScript funcionando (6/6) ✅
- [x] BBAS3 re-sync com confidence 0.58 ✅
- [ ] 14 assets prioritarios com confidence >= 0.5
- [ ] Reduzir assets failed de 192 para < 50

---

## GAP 3: 6.276 ALERTAS DE QUALIDADE

### Causa Raiz

Alertas pendentes na validacao de cross-validation entre scrapers.

### Plano de Acao

#### Fase 3.1: Categorizar Alertas (30 min)

```bash
# Acessar pagina de Data Sources
# URL: http://localhost:3100/data-sources
# Tab: Qualidade

# Via API - listar alertas
curl -s "http://localhost:3101/api/v1/scrapers/quality-alerts?limit=100" | jq '.[] | {type, severity, count}'
```

#### Fase 3.2: Resolver Alertas por Categoria (2h)

**Categoria A: Divergencia de Preco (Esperado)**
- Alertas onde fontes divergem < 5% sao normais
- Marcar como "Revisado" automaticamente

**Categoria B: Dados Faltantes**
- Re-executar scraper para asset especifico
- Se persistir, marcar fonte como "Indisponivel para asset"

**Categoria C: Outliers**
- Verificar se valor e real ou erro de parsing
- Corrigir parser se necessario

```bash
# Resolver alertas em lote
curl -X POST "http://localhost:3101/api/v1/scrapers/quality-alerts/resolve-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "price_divergence",
    "threshold": 5,
    "action": "mark_reviewed"
  }'
```

### Criterios de Sucesso Gap 3
- [ ] Alertas criticos (severity=high) = 0
- [ ] Alertas totais reduzidos em 80%
- [ ] Categorias de alerta documentadas

---

## GAP 4: 18 ASSETS PENDENTES DE SYNC

### Causa Raiz

Assets novos ou com erros de sync anteriores.

### Plano de Acao

#### Fase 4.1: Identificar Assets (15 min)

```bash
# Listar assets pendentes
curl -s "http://localhost:3101/api/v1/assets?lastUpdateStatus=pending&limit=50" | jq '.[].ticker'
```

#### Fase 4.2: Executar Sync Manual (45 min)

```bash
# Sync individual
for ticker in TICK1 TICK2 TICK3; do
  curl -X POST "http://localhost:3101/api/v1/scrapers/sync/$ticker"
  sleep 5
done

# Ou via queue
curl -X POST "http://localhost:3101/api/v1/queue/sync-assets" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["TICK1", "TICK2", "TICK3"]}'
```

### Criterios de Sucesso Gap 4
- [ ] 0 assets com status "Pendente"
- [ ] Todos assets tem pelo menos 1 fonte de dados

---

## GAP 5: ACESSIBILIDADE (FORM FIELDS)

### Causa Raiz

Alguns campos de formulario sem atributo `id` associado ao `label`.

### Plano de Acao

#### Fase 5.1: Identificar Campos (30 min)

```bash
# Executar audit de acessibilidade
# Via MCP a11y
curl -s "http://localhost:3101/api/v1/a11y/audit" | jq '.violations'
```

#### Fase 5.2: Corrigir Componentes (1-2h)

Arquivos a verificar:
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/forms/*.tsx`
- `frontend/src/app/(dashboard)/settings/page.tsx`

Correcao tipica:
```tsx
// Antes
<Input placeholder="Nome" />

// Depois
<div>
  <Label htmlFor="name">Nome</Label>
  <Input id="name" placeholder="Nome" />
</div>
```

### Criterios de Sucesso Gap 5
- [ ] 0 violacoes WCAG 2.1 AA em audit
- [ ] Todos inputs tem label associado
- [ ] Tab navigation funciona corretamente

---

## ORDEM DE EXECUCAO RECOMENDADA

```
Dia 1 (4-5h):
├── Gap 1: Fundamentei Scraper [ALTA] (2-3h)
│   ├── 1.1 Gerar Cookies OAuth
│   ├── 1.2 Validar Cookies
│   └── 1.3 Testar Scraper
└── Gap 3: Alertas Qualidade [MEDIA] (2h)
    ├── 3.1 Categorizar
    └── 3.2 Resolver em lote

Dia 2 (5-6h):
├── Gap 2: Sync Parcial [MEDIA] (4-5h)
│   ├── 2.1 Identificar prioritarios
│   ├── 2.2 Executar sync historico
│   └── 2.3 Validar
└── Gap 4: Assets Pendentes [BAIXA] (1h)
    └── Sync manual

Dia 3 (1-2h):
└── Gap 5: Acessibilidade [BAIXA] (1-2h)
    ├── 5.1 Audit
    └── 5.2 Correcoes
```

---

## METRICAS DE SUCESSO FINAL

| Metrica | Antes | Meta | Atual |
|---------|-------|------|-------|
| Fundamentei Success Rate | 50% | >= 90% | **100%** ✅ |
| Assets com Sync Completo | 54 (6.3%) | >= 200 (25%) | Pendente |
| Alertas Qualidade | 6.276 | < 500 | Pendente |
| Assets Pendentes | 18 | 0 | Pendente |
| Violacoes Acessibilidade | ? | 0 | Pendente |

---

## COMANDOS DE VERIFICACAO POS-TROUBLESHOOTING

```bash
# Verificar status geral
curl -s "http://localhost:3101/api/v1/health" | jq '.'

# Verificar scrapers
curl -s "http://localhost:3101/api/v1/scrapers/status" | jq '.[] | {name, successRate}'

# Verificar assets
curl -s "http://localhost:3101/api/v1/assets/stats" | jq '.'

# Verificar alertas restantes
curl -s "http://localhost:3101/api/v1/scrapers/quality-alerts/count"
```

---

**Documento gerado automaticamente em 2025-12-05**
**Proxima revisao apos execucao do plano**
