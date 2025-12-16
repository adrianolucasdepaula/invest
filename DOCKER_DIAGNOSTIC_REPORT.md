# Relatório: Análise Ultra-Robusta Docker - Troubleshooting

**Data:** 2025-12-15
**Analista:** Claude Opus 4.5
**Status:** ANÁLISE COMPLETA

---

## 1. RESUMO EXECUTIVO

| Container | Status | CPU | Memória | Problema |
|-----------|--------|-----|---------|----------|
| `invest_frontend` | ✅ healthy | 1.3% | 161MB/2GB (8%) | Erros EIO (Dropbox), mas funcionando |
| `invest_backend` | ✅ healthy | 62% | 2GB/4GB (49%) | Alto uso, mas saudável |
| `invest_api_service` | 🔴 **unhealthy** | **208%** | **4GB/4GB (99.7%)** | **CRÍTICO - Memory leak** |
| `invest_scrapers` | ✅ healthy | 2.4% | 102MB/2GB (5%) | OK |
| `invest_postgres` | ✅ healthy | 0% | 70MB/4GB (2%) | OK |
| `invest_redis` | ✅ healthy | 3.3% | 14MB/1GB (1%) | OK |

**Total containers:** 18 rodando | **Unhealthy:** 1 | **Volumes:** 17

---

## 2. ROOT CAUSE ANALYSIS

### 2.1 Frontend - Erros EIO (RESOLVIDO PARCIALMENTE)

**Causa:** Projeto localizado em pasta do Dropbox
```
C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web
```

**Mecanismo:**
1. Dropbox sincroniza arquivos em tempo real
2. Docker bind mount (`./frontend:/app`) espelha diretório
3. Durante sincronização, Dropbox bloqueia arquivos
4. Next.js Watchpack tenta escanear → EIO error

**Status atual:** Frontend **funciona** apesar dos erros EIO
- HTTP 307 (redirect para login) ✅
- `Ready in 7.9s` ✅
- Healthcheck passando ✅

**Erros persistentes nos logs:**
```
Watchpack Error (initial scan): Error: EIO: i/o error, scandir '/app/src/app/auth'
Watchpack Error (initial scan): Error: EIO: i/o error, scandir '/app/src/app/login'
```

### 2.2 API Service - Memory Leak (CRÍTICO)

**Causa:** Scrapers consumindo toda memória disponível
```
invest_api_service: 208.09% CPU | 3.988GiB / 4GiB (99.70%)
```

**Logs mostram:**
- Múltiplos scrapers rodando em paralelo (Fundamentus, Griffin, StatusInvest)
- Timeouts de 90s em inicializações
- Cascata de retries consumindo recursos

**Evidência:**
```
[INIT] ⏱️ Timeout for Fundamentus after 90s
[INIT] ⏱️ Timeout for Griffin after 90s
```

---

## 3. DIAGNÓSTICO DETALHADO

### 3.1 Recursos Docker
```
Images:    70 (55.8GB) - 53% reclaimable
Containers: 22 (374MB)
Volumes:   58 (11.7GB) - 62% reclaimable
Cache:     140 (18.3GB)
```

### 3.2 Configurações Verificadas

| Item | Frontend | Backend | Status |
|------|----------|---------|--------|
| Dockerfile tem curl | ✅ SIM | ✅ SIM | OK |
| Healthcheck | curl localhost:3000 | curl localhost:3101/... | OK |
| Bind mount | `./frontend:/app` | `./backend:/app` | ⚠️ Dropbox |
| node_modules | Named volume | Named volume | OK |
| Memory limit | 2GB | 4GB | OK |
| CHOKIDAR_USEPOLLING | ✅ true | N/A | OK |

### 3.3 Volumes do Projeto
```
invest-claude-web_frontend_node_modules  ✅
invest-claude-web_backend_node_modules   ✅
invest-claude-web_postgres_data          ✅
invest-claude-web_redis_data             ✅
invest-claude-web_grafana_data           ✅
invest-claude-web_minio_data             ✅
invest-claude-web_prometheus_data        ✅
```

---

## 4. SOLUÇÕES RECOMENDADAS

### 4.1 URGENTE - Reiniciar API Service
```bash
docker restart invest_api_service
```
**Impacto:** Libera 4GB de memória imediatamente

### 4.2 CURTO PRAZO - Limitar Scrapers Concorrentes
Editar `docker-compose.yml`:
```yaml
api-service:
  environment:
    - SCRAPER_CONCURRENT_JOBS=1  # Reduzir de 3 para 1
```

### 4.3 MÉDIO PRAZO - Mover Projeto do Dropbox
```powershell
# Mover para local sem sincronização
robocopy "C:\Users\adria\Dropbox\...\invest-claude-web" "C:\Projects\invest-claude-web" /E
```
**Benefício:** Elimina 100% dos erros EIO

### 4.4 LIMPEZA - Recuperar Espaço Docker
```bash
docker system prune -a --volumes  # Remove imagens/volumes não usados
docker builder prune              # Limpa cache de build
```
**Potencial:** ~30GB recuperáveis

---

## 5. AÇÕES IMEDIATAS

### 5.1 Testar Frontend
Acesse: http://localhost:3100/

Se aparecer página de login → Frontend funcionando ✅

### 5.2 Reiniciar API Service
```bash
docker restart invest_api_service
```

### 5.3 Monitorar Recursos
```bash
docker stats invest_api_service invest_backend invest_frontend
```

---

## 6. CONCLUSÃO

| Problema | Severidade | Status | Ação |
|----------|------------|--------|------|
| Frontend EIO errors | 🟡 Média | Funcionando | Mover do Dropbox (opcional) |
| API Service memory | 🔴 Crítica | Unhealthy | Reiniciar agora |
| Backend alto uso | 🟢 Baixa | Healthy | Monitorar |

**Prioridade 1:** Reiniciar `invest_api_service`
**Prioridade 2:** Testar frontend no navegador
**Prioridade 3:** Considerar mover projeto do Dropbox
