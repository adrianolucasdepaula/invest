# Análise Completa: Exit Code 137 - Python Scrapers

**Data:** 2025-11-28
**Container:** `invest_scrapers`
**Contexto:** Migração Selenium → Playwright

---

## 🔍 O que é Exit Code 137?

**Exit Code 137 = 128 + 9 (SIGKILL)**

Significa que o processo foi **forçadamente terminado** pelo sistema operacional com o sinal SIGKILL (não pode ser capturado pelo processo).

---

## 📋 Causas Possíveis

### 1. OOM Killer (Out of Memory) - MAIS PROVÁVEL ⚠️

**O que é:** Kernel Linux mata processos quando memória RAM acaba

**Como identificar:**
```bash
# No host (não no container)
dmesg | grep -i oom
dmesg | grep -i "killed process"

# Logs do Docker
docker inspect invest_scrapers | grep -i memory

# Stats em tempo real
watch -n 1 'docker stats invest_scrapers --no-stream'
```

**Sintomas:**
- ✅ Processo morre abruptamente (sem erro de Python)
- ✅ Sempre no mesmo ponto (durante navegação/extração)
- ✅ Exit code exatamente 137

**Evidências no nosso caso:**
- Chrome é memory-intensive (pode usar 200-500MB por instância)
- Container tem limite de 2GB (`mem_limit: 2g`)
- Múltiplos scrapers rodando = múltiplos browsers

---

### 2. Timeout do Docker/Sistema

**O que é:** Container ou processo atinge tempo máximo de execução

**Como identificar:**
```bash
docker inspect invest_scrapers | grep -i timeout
```

**Sintomas:**
- Processo sempre morre após X segundos
- Tempo consistente entre execuções

**Evidências no nosso caso:**
- ❌ Tempo varia entre execuções
- ❌ Nenhum timeout configurado explicitamente

**Conclusão:** IMPROVÁVEL

---

### 3. cgroup Resource Limits

**O que é:** Limites de recursos do container (CPU, memória, I/O)

**Como identificar:**
```bash
docker inspect invest_scrapers | grep -i "Memory\|Cpu"
cat /sys/fs/cgroup/memory/docker/*/memory.limit_in_bytes
```

**Sintomas:**
- Container atinge limite e é terminado
- Pode ser memória, CPU throttling extremo, etc

**Evidências no nosso caso:**
- ✅ Container tem `mem_limit: 2g` (confirmado em docker-compose.yml)
- ⚠️ Pode estar excedendo este limite

---

### 4. Chrome Crash

**O que é:** Google Chrome trava e é morto pelo sistema

**Como identificar:**
- Verificar se Chrome deixa core dump
- Logs do Chrome/Playwright

**Sintomas:**
- Chrome específico, não Python
- Pode ser segfault, assertion failure

**Evidências no nosso caso:**
- ✅ Chrome standalone funciona (testamos `google-chrome --headless`)
- ✅ Playwright com páginas simples funciona (example.com)
- ⚠️ Só falha com Fundamentus (página complexa)

---

## 🧪 Testes Realizados

### ✅ Teste 1: Python Básico

```bash
docker exec invest_scrapers python -c "print('Python OK')"
```

**Resultado:** ✅ SUCESSO

---

### ✅ Teste 2: Import do Scraper

```python
from scrapers.fundamentus_scraper import FundamentusScraper
print("Import OK")
```

**Resultado:** ✅ SUCESSO

---

### ✅ Teste 3: Criação do Objeto Scraper

```python
scraper = FundamentusScraper()
print(f"Scraper criado: {scraper.name}")
```

**Resultado:** ✅ SUCESSO (após fix do asyncio.Lock no __init__)

---

### ✅ Teste 4: Chrome Standalone

```bash
google-chrome --headless --dump-dom https://www.google.com
```

**Resultado:** ✅ SUCESSO - Chrome funciona

---

### ✅ Teste 5: Playwright + Página Simples

```python
await page.goto('http://example.com')
print(await page.title())  # "Example Domain"
```

**Resultado:** ✅ SUCESSO - Playwright funciona

---

### ⚠️ Teste 6: Playwright + Fundamentus (completo)

```python
await page.goto('https://www.fundamentus.com.br/detalhes.php?papel=PETR4')
data = await scraper._extract_data('PETR4')
```

**Resultado:** ⚠️ PARCIAL
- ✅ Browser criado
- ✅ Page criada
- ✅ Navegação iniciada
- ✅ Extração PARCIAL (consegue extrair alguns campos):
  - PETR4
  - PETROBRAS PN
  - Setor: Petróleo. Gás e Biocombustíveis
  - Min 52 sem: 28.3
  - Max 52 sem: 35.88
  - Vol $ méd (2m): 1104810000.0
  - Valor de mercado: 417595000000.0
- ❌ **KILLED (exit 137)** após ~10 segundos de extração

---

## 📊 Logs Detalhados do Erro

```
2025-11-28 11:29:34.150 | INFO | base_scraper:scrape_with_retry:236 - [Fundamentus] Scraping PETR4 (attempt 1/3)
2025-11-28 11:29:34.150 | INFO | base_scraper:initialize:139 - [INIT QUEUE] Initializing Fundamentus...
2025-11-28 11:29:34.616 | DEBUG | base_scraper:_create_browser_and_page:98 - Playwright browser created for Fundamentus
2025-11-28 11:29:34.899 | DEBUG | base_scraper:_create_browser_and_page:114 - Playwright page created for Fundamentus
2025-11-28 11:29:34.899 | INFO | base_scraper:initialize:150 - [INIT QUEUE] ✅ Fundamentus initialized successfully
2025-11-28 11:29:36.901 | INFO | scrapers.fundamentus_scraper:scrape:61 - Navigating to https://www.fundamentus.com.br/detalhes.php?papel=PETR4
[... dados sendo extraídos ...]
2025-11-28 11:29:42.044 | DEBUG | scrapers.fundamentus_scraper:_map_field:304 - Unmapped Fundamentus field: 'valor de mercado' = 417595000000.0
[PROCESSO MORTO - EXIT CODE 137]
```

**Timeline:**
- T+0s: Início do scraping
- T+0.5s: Browser criado
- T+0.7s: Page criada
- T+0.9s: Inicialização completa
- T+2.9s: Navegação inicia
- T+6.8s: Página carregada, extração inicia
- T+8.0s: ~10 campos extraídos
- T+8.0s: **KILLED** ❌

---

## 💡 Hipótese Principal

**OOM (Out of Memory) Killer matando o processo Chrome**

### Cálculo de Memória Estimado:

```
Container limit: 2048 MB (2GB)

Uso base do container:
- Python runtime: ~50 MB
- Sistema (fluxbox, VNC, etc): ~100 MB
- Total base: ~150 MB

Chrome durante scraping:
- Browser process: ~100-200 MB
- Renderer process: ~100-300 MB
- GPU process: ~50-100 MB (mesmo com --disable-gpu, pode alocar)
- Network process: ~50 MB
- Utilitários: ~50 MB
- Total Chrome: ~350-700 MB

Pico durante navegação:
- Página HTML grande: ~20 MB
- JavaScript execution: ~50-100 MB
- Imagens/assets: ~30 MB
- DOM tree: ~20-50 MB
- Total navegação: ~120-200 MB

TOTAL ESTIMADO: 150 + 700 + 200 = ~1050 MB (no pico)
```

**Dentro do limite?** Teoricamente SIM (1050MB < 2048MB)

**MAS:**
- Picos temporários podem ultrapassar
- Python asyncio overhead
- Playwright overhead
- Cheerio parsing (se usado)
- Múltiplos browsers se rodando concorrentemente

---

## 🔧 Soluções Propostas

### Solução 1: Aumentar Limite de Memória ⭐ RECOMENDADO

```yaml
# docker-compose.yml
services:
  scrapers:
    mem_limit: 4g  # Aumentar de 2g para 4g
    memswap_limit: 4g
```

**Prós:**
- ✅ Solução direta
- ✅ Sem mudanças no código
- ✅ Backend TypeScript funciona com recursos suficientes

**Contras:**
- ❌ Usa mais RAM do host
- ❌ Não resolve problema de eficiência

---

### Solução 2: Otimizar Uso de Memória

```python
# Reduzir tamanho da página carregada
await page.set_extra_http_headers({
    'Accept': 'text/html',  # Não baixar imagens/css/js desnecessários
})

# Bloquear recursos pesados
await page.route("**/*", lambda route: (
    route.abort() if route.request.resource_type in ["image", "stylesheet", "font"]
    else route.continue_()
))

# Limpar recursos após extração
await page.evaluate("() => { document.body.innerHTML = ''; }")
```

**Prós:**
- ✅ Reduz uso de memória
- ✅ Melhora performance

**Contras:**
- ❌ Pode quebrar sites que dependem de JS
- ❌ Requer testes extensivos

---

### Solução 3: Usar Playwright Chromium (não sistema Chrome)

```bash
# Instalar browsers do Playwright
docker exec invest_scrapers playwright install chromium
```

```python
# Não usar Chrome do sistema
executable_path = None  # Usa Playwright's Chromium
```

**Prós:**
- ✅ Chromium headless_shell é mais leve

**Contras:**
- ❌ Requer download de ~160MB
- ❌ Dockerfile install falhou antes

---

### Solução 4: Simplificar Extração

```python
# Extrair apenas campos essenciais (não todos os 50+ campos)
ESSENTIAL_FIELDS = ['cotacao', 'pl', 'pvp', 'dividendYield', 'roe', 'roic']
```

**Prós:**
- ✅ Reduz processamento
- ✅ Pode evitar OOM

**Contras:**
- ❌ Perde dados
- ❌ Não é solução real

---

## 📝 Próximos Passos

### Imediato (agora):

1. ✅ **Monitorar memória durante execução**
   ```bash
   watch -n 0.5 'docker stats invest_scrapers --no-stream'
   ```

2. ⏳ **Verificar OOM no host**
   ```bash
   dmesg | grep -i oom | tail -20
   ```

3. ⏳ **Tentar com limite maior**
   - Editar `docker-compose.yml`: `mem_limit: 4g`
   - `docker-compose up -d --force-recreate scrapers`
   - Re-testar

### Curto prazo (hoje):

4. ⏳ **Implementar otimizações de memória** (Solução 2)

5. ⏳ **Comparar com backend TypeScript**
   - Backend usa mesma config mas funciona
   - Verificar diferenças de consumo de memória

### Médio prazo (esta semana):

6. ⏳ **Validar scrapers já migrados**
   - bcb_scraper.py
   - fundamentus_scraper.py (após resolver OOM)

7. ⏳ **Continuar migração em massa**
   - Próximo: advfn_scraper.py ou outro scraper crítico

---

## 📚 Referências Técnicas

- [Docker Memory Limits](https://docs.docker.com/config/containers/resource_constraints/)
- [Linux OOM Killer](https://www.kernel.org/doc/gorman/html/understand/understand016.html)
- [Playwright Python - Reducing Memory](https://playwright.dev/python/docs/ci)
- [Chrome Memory Usage](https://www.chromium.org/developers/design-documents/multi-process-architecture/)

---

**Última atualização:** 2025-11-28 11:35 BRT
**Próxima ação:** Aumentar mem_limit e re-testar
