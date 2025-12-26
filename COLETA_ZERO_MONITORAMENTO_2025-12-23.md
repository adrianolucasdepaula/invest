# Monitoramento Coleta do Zero - 2025-12-23

## Início

**Data:** 2025-12-23 20:31
**Jobs:** 861 ativos
**Sistema:** Zerado (banco limpo, fila limpa)

---

## Checkpoint 1 - 20:33 (2min)

**Coleta:**
- Fundamentals: 5
- Jobs: API temp. indisponível

**Saúde:**
- API zombies: 0
- Python API: OK

---

## Checkpoint 2 - 20:35 (4min)

**Coleta:**
- Fundamentals: 3

**Saúde:**
- API zombies: 0
- Python API: OK

---

## Checkpoint 3 - 20:37 (6min)

**Coleta:**
- Fundamentals: 3

**Saúde:**
- API zombies: 0
- Python API: OK

---

## Checkpoint 4 - 20:39 (8min)

**Coleta:**
- Fundamentals: 2

**Saúde:**
- API zombies: 0
- Python API: OK

---

## Checkpoint 5 - 20:41 (10min) ⚠️ ALERTA

**Coleta:**
- Fundamentals: 3
- **Total: 18** (últimos 10min)

**Saúde:**
- API zombies: **1** 🔴
- Python API: **TIMEOUT** 🔴

**Recursos invest_api_service:**
- CPU: **199.65%** (2 cores)
- Memory: **99.74%** (limite!)
- Processos: **1.895**
- Playwright drivers: **5 ativos**

**Diagnóstico:**
- Python API começando a sobrecarregar
- Muitos scrapers simultâneos
- Memória estourando
- Começando a não responder

---

## Qualidade dos Dados (Checkpoint 10min)

**Total: 18 fundamentals**
- Com discrepâncias: **14/18 (77.8%)** 🔴
- Média fontes: **4.3** ✅

**Taxa discrepâncias:**
- Meta: <10%
- Atual: **77.8%**
- **GAP: 67.8 pontos percentuais** 🔴

---

## Causa Raiz Python API Travamento (Hipótese)

**Padrão observado:**
1. Coleta inicia: Python API OK
2. Após 8-10min: CPU sobe para 200%
3. Memory atinge 99%
4. Processos: ~2.000
5. Python API começa a dar timeout
6. Worker process pode crashar

**Possíveis causas:**
1. **Muitos scrapers simultâneos** (backend pede fallback para múltiplos ativos ao mesmo tempo)
2. **Browsers Playwright não fecham** (5 drivers ativos = memory leak)
3. **Concurrency muito alta** no Python (sem rate limiting)
4. **Memory limit 4GB insuficiente** para carga atual

---

## Próximos Checkpoints

Continuarei monitorando a cada 5-10min...
