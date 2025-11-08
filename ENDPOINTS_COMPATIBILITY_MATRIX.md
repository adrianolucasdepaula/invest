# ENDPOINTS COMPATIBILITY MATRIX
## Frontend vs Backend - Mapeamento Completo

**Generated:** 2025-11-08

---

## LEGENDA

- ✅ = Funcionando, consistente
- ❌ = Incompatível ou não implementado
- ⚠️ = Funciona parcialmente ou com ressalvas
- 🔒 = Requer autenticação JWT

---

## AUTHENTICATION ENDPOINTS

| # | Method | Frontend | Backend | Status | Notas |
|---|--------|----------|---------|--------|-------|
| 1 | POST | /auth/register | /auth/register | ✅ | Rate limit: 3/hr |
| 2 | POST | /auth/login | /auth/login | ✅ | Rate limit: 5/5min |
| 3 | POST | /auth/google | /auth/google | ✅ | Google OAuth |
| 4 | GET | - | /auth/google/callback | ✅ | OAuth callback |
| 5 | GET | /auth/profile | /auth/me | ❌ | **ROTA MISMATCH** |

---

## ASSETS ENDPOINTS

| # | Method | Frontend | Backend | Status | Notas |
|---|--------|----------|---------|--------|-------|
| 6 | GET | /assets | /assets | ✅ | Suporta filtros |
| 7 | GET | /assets/:ticker | /assets/:ticker | ✅ | Public |
| 8 | GET | /assets/:ticker/prices | /assets/:ticker/price-history | ❌ | **ROTA MISMATCH** |
| 9 | GET | /assets/:ticker/fundamentals | - | ❌ | **NÃO EXISTE** |
| 10 | POST | - | /assets/:ticker/sync | ✅ | 🔒 Protected |

---

## PORTFOLIO ENDPOINTS

| # | Method | Frontend | Backend | Status | Notas |
|---|--------|----------|---------|--------|-------|
| 11 | GET | /portfolio | /portfolio | ✅ | 🔒 Protected |
| 12 | GET | /portfolio/:id | /portfolio/:id | ✅ | 🔒 Protected |
| 13 | POST | /portfolio | /portfolio | ✅ | 🔒 Protected |
| 14 | PATCH | /portfolio/:id | /portfolio/:id | ✅ | 🔒 Protected |
| 15 | DELETE | /portfolio/:id | /portfolio/:id | ✅ | 🔒 Protected |
| 16 | POST | /portfolio/:id/positions | /portfolio/:id/positions | ✅ | 🔒 Protected |
| 17 | PATCH | /portfolio/:id/positions/:posId | /portfolio/:id/positions/:posId | ✅ | 🔒 Protected |
| 18 | DELETE | /portfolio/:id/positions/:posId | /portfolio/:id/positions/:posId | ✅ | 🔒 Protected |
| 19 | POST | /portfolio/import | /portfolio/import | ⚠️ | Mock buffer |

---

## ANALYSIS ENDPOINTS

| # | Method | Frontend | Backend | Status | Notas |
|---|--------|----------|---------|--------|-------|
| 20 | POST | /analysis | - | ❌ | **NÃO EXISTE** - Frontend espera genérico |
| 21 | POST | - | /analysis/:ticker/fundamental | ✅ | 🔒 Protected |
| 22 | POST | - | /analysis/:ticker/technical | ✅ | 🔒 Protected |
| 23 | POST | - | /analysis/:ticker/complete | ✅ | 🔒 Protected |
| 24 | GET | /analysis | /analysis/:ticker | ❌ | **INCOMPATÍVEL** - requer ticker |
| 25 | GET | - | /analysis/:id/details | ✅ | 🔒 Protected |

---

## REPORTS ENDPOINTS

| # | Method | Frontend | Backend | Status | Notas |
|---|--------|----------|---------|--------|-------|
| 26 | GET | /reports | /reports | ✅ | 🔒 Protected |
| 27 | GET | /reports/:id | /reports/:id | ✅ | 🔒 Protected |
| 28 | POST | /reports/generate | /reports/generate | ✅ | 🔒 Protected |
| 29 | GET | /reports/:id/download | /reports/:id/download | ✅ | 🔒 pdf/html/json |

---

## DATA-SOURCES ENDPOINTS

| # | Method | Frontend | Backend | Status | Notas |
|---|--------|----------|---------|--------|-------|
| 30 | GET | /data-sources | /data-sources | ✅ | Public |
| 31 | GET | /data-sources/status | /data-sources/status | ✅ | Public |
| 32 | POST | /data-sources/:id/test | - | ❌ | **NÃO IMPLEMENTADO** |
| 33 | POST | /data-sources/scrape | - | ❌ | **NÃO IMPLEMENTADO** |
| 34 | PATCH | /data-sources/:id | - | ❌ | **NÃO IMPLEMENTADO** |

---

## OAUTH SERVICE ENDPOINTS (External - Port 8000)

| # | Method | Frontend | Backend | Status | Notas |
|---|--------|----------|---------|--------|-------|
| 35 | POST | /api/oauth/session/start | - | ✅ | OAuth setup |
| 36 | GET | /api/oauth/session/status | - | ✅ | Session status |
| 37 | POST | /api/oauth/session/confirm-login | - | ✅ | Confirm login |
| 38 | POST | /api/oauth/session/skip-site | - | ✅ | Skip site |
| 39 | POST | /api/oauth/session/save | - | ✅ | Save cookies |
| 40 | DELETE | /api/oauth/session/cancel | - | ✅ | Cancel session |
| 41 | GET | /api/oauth/vnc-url | - | ✅ | VNC URL |
| 42 | GET | /api/oauth/sites | - | ✅ | Sites list |
| 43 | POST | /api/oauth/navigate/:siteId | - | ✅ | Navigate |
| 44 | GET | /api/oauth/health | - | ✅ | Health check |

---

## WEBSOCKET EVENTS

### Subscribe/Unsubscribe

| # | Event | Direction | Payload | Status | Notas |
|---|-------|-----------|---------|--------|-------|
| 45 | subscribe | → Backend | `{tickers[], types[]}` | ✅ | Room-based |
| 46 | unsubscribe | → Backend | `{tickers?, types?}` | ✅ | Leave rooms |

### Broadcast Events

| # | Event | Direction | Payload | Status | Notas |
|---|-------|-----------|---------|--------|-------|
| 47 | price_update | ← Frontend | `{ticker, data, timestamp}` | ✅ | Real-time |
| 48 | analysis_complete | ← Frontend | `{ticker, id, type, timestamp}` | ✅ | Async job |
| 49 | report_ready | ← Frontend | `{ticker, reportId, timestamp}` | ✅ | Async job |
| 50 | portfolio_update | ← Frontend | `{userId, portfolioId, data, timestamp}` | ✅ | Real-time |
| 51 | market_status | ← Frontend | `{status, timestamp}` | ✅ | Broadcast |

---

## RESUMO ESTATÍSTICO

### Por Status

| Status | Quantidade | Percentual |
|--------|-----------|-----------|
| ✅ Funcionando | 34 | 73.9% |
| ❌ Quebrado | 8 | 17.4% |
| ⚠️ Parcial | 1 | 2.2% |
| Não Implementado | 5 | 10.9% |
| **TOTAL** | **46** | **100%** |

### Por Módulo

| Módulo | Total | OK | ❌ | Taxa |
|--------|-------|----|----|------|
| Authentication | 5 | 4 | 1 | 80% |
| Assets | 5 | 3 | 2 | 60% |
| Portfolio | 9 | 8 | 1 | 89% |
| Analysis | 6 | 3 | 3 | 50% |
| Reports | 4 | 4 | 0 | 100% |
| Data Sources | 5 | 2 | 3 | 40% |
| OAuth | 9 | 9 | 0 | 100% |
| WebSocket | 6 | 6 | 0 | 100% |

### Severity Distribution

| Severidade | Quantidade | Ação Recomendada |
|-----------|-----------|-----------------|
| 🔴 Crítico | 3 | Fix ASAP (hoje) |
| 🟠 Alto | 3 | Fix esta semana |
| 🟡 Médio | 2 | Fix próximas sprints |

---

## PRÓXIMAS AÇÕES

### Imediato (Today - 🔴)

```
[ ] 1. GET /auth/profile → Adicionar alias em /auth/me
[ ] 2. GET /assets/:ticker/prices → Adicionar alias em /price-history  
[ ] 3. POST /analysis → Criar endpoint genérico
```

**Tempo estimado:** 2-4 horas

### Curto Prazo (This Week - 🟠)

```
[ ] 4. GET /analysis → Tornar ticker opcional
[ ] 5. POST /data-sources/scrape → Implementar
[ ] 6. GET /assets/:ticker/fundamentals → Criar endpoint
```

**Tempo estimado:** 4-6 horas

### Médio Prazo (Next Sprint - 🟡)

```
[ ] 7. POST /data-sources/:id/test → Implementar
[ ] 8. PATCH /data-sources/:id → Implementar
```

**Tempo estimado:** 2-4 horas

### Longo Prazo (Roadmap - 🔵)

```
[ ] OpenAI Integration (complete)
[ ] Multer para Portfolio Import
[ ] OAuth Service Connection
[ ] Comprehensive Testing
```

**Tempo estimado:** 16-24 horas

---

## RISK ASSESSMENT

### Critical Path Items

1. **Authentication** - Bloqueador para tudo
   - Fix: GET /auth/profile (30 min)
   - Status: ❌ BLOCKER

2. **Analysis** - Feature central
   - Fix: POST /analysis + GET /analysis (2-3 hrs)
   - Status: ❌ BLOCKER

3. **Asset Details** - Common use case
   - Fix: GET /assets/:ticker/prices + fundamentals (1 hr)
   - Status: ❌ BLOCKER

### Nice to Have

- Data Sources management (not blocking MVP)
- Portfolio import advanced features

---

## DEPLOYMENT READINESS

**Current Status:** ⛔ NOT READY

**Critical Blockers:** 3
- Must fix before ANY production deployment
- Estimated time: 2-4 hours

**Recommended Timeline:**

```
Day 1: Fix critical blockers (2-4 hrs)
Day 2: Implement high priority (4-6 hrs)
Day 3: Testing & QA (4-6 hrs)
Day 4: Staging deployment
Day 5: Production deployment
```

**Total time to production:** 5-7 days

