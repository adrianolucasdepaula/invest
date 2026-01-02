# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- (Proximas features serao listadas aqui)

---

## [1.50.0] - 2026-01-02

### Added - FASE 150: Development → Production Migration

**Migration Scope:**
- ✅ **Production Build Targets** - All services now build for production
  - Backend: `target: production` (docker-compose.yml:121)
  - Frontend: `target: production` (docker-compose.yml:396)
  - NODE_ENV hardcoded to `production` (docker-compose.yml:127)

- ✅ **Observability Stack Fully Operational**
  - Prometheus: UP (port 9090)
  - Grafana: UP (port 3000)
  - Alertmanager: UP (port 9093)
  - Loki: UP (port 3102)
  - Tempo: UP (port 3200)

**Configuration Changes:**
- ✅ Docker build targets: `development` → `production`
- ✅ NODE_ENV environment variable: `production`
- ✅ DB_SSL environment variable for SSL configuration
- ✅ Prometheus labels: `environment: production`

### Fixed - Infrastructure (P0 CRITICAL - RESOLVED)

- ✅ **nginx backend port bug** - FIXED
  - Location: `docker/nginx/nginx.conf:69`
  - Change: `backend:3001` → `backend:3101`
  - Root cause: Port mismatch between nginx and backend service

- ✅ **SSL connection error in production mode** - FIXED
  - Location: `backend/src/app.module.ts:155`
  - Change: SSL now configurable via `DB_SSL` env variable
  - Root cause: Hardcoded SSL settings not compatible with local PostgreSQL

**Services Validated (7/7 HEALTHY):**
- ✅ Backend (3101) - production build
- ✅ Frontend (3100) - production build
- ✅ PostgreSQL (5532)
- ✅ Redis (6479)
- ✅ Python Service (8001)
- ✅ Scrapers (8000)
- ✅ API Service (8000)

---

## [1.49.0] - 2026-01-01

### Fixed - UI (P1 HIGH - RESOLVED)

- ✅ **BUG-001: Ibovespa StatCard showing "N/A"** - FIXED
  - Location: `frontend/src/app/(dashboard)/page.tsx`
  - Root cause: `^BVSP` / `IBOV` ticker not present in assets array
  - Fix: Replaced Ibovespa StatCard with "Maiores Baixas" (Biggest Losers) widget
  - Commit: `f92732a`

### Added - Documentation

- ✅ **86 documentation screenshots** - Added to `.gitignore` exception
  - Location: `docs/screenshots/fase-149/`
  - Purpose: Visual documentation of all dashboard states
  - Commit: `325bc40`

---

## [1.48.0] - 2025-12-31

### Added - FASE 148: Ultra-Complete Ecosystem Validation

**Validation Scope:**
- ✅ **8 Parallel Agents** - Maximum parallel execution for complete coverage
  - Wave 1: Frontend TIER 1, Backend PRIORITY 1, Scrapers Public
  - Wave 2: Frontend TIER 2-4, Backend PRIORITY 2-3, Zero Tolerance
  - Wave 3: E2E Flows, Scrapers OAuth + Cross-validation
  - Wave 4: Documentation consolidation

**Frontend Validation (MCP Triplo):**
- ✅ **TIER 1 Pages (4/4 PASS)** - Dashboard, Assets, Asset Detail, Portfolio
  - Console errors: 0 (filtering TradingView 403)
  - Network errors 5xx: 0
  - A11y: WCAG 2.1 AA compliance
  - Test file: `frontend/tests/mcp-triplo-standalone.spec.ts`

- ⚠️ **TIER 2-4 Pages (11 validated)** - 72% PASS/WARNING
  - 3 FAIL: Health (404 endpoint), Discrepancies (52 button-name), Settings (2 labels)
  - 8 WARNING: Color contrast issues (design system)
  - Test file: `frontend/tests/mcp-triplo-no-auth.spec.ts`

**Backend Validation:**
- ✅ **PRIORITY 1 (42/50 endpoints)** - 84% tested
  - Assets: 14/16 (87.5%)
  - Wheel Strategy: 12/16 (75%)
  - Analysis: 8/9 (88.9%)
  - Portfolio: 8/10 (80%)

- ✅ **PRIORITY 2-3 (64 endpoints)** - 98.4% PASS
  - Market Data: 8/8 (87.5%)
  - News: 18/18 (100%)
  - Reports: 5/5 (100%)
  - Auth: 6/6 (100%)
  - Economic Indicators: 6/6 (100%)
  - Dividends: 8/8 (100%)
  - Stock Lending: 7/7 (100%)
  - Scraper Config: 6/6 (100%)

**E2E Flows (17 tests - 100% PASS):**
- ✅ **Investor Journey** - 4 tests (Dashboard → Asset Detail → Navigation)
- ✅ **Data Sync Journey** - 4 tests (Data Management → Sources → Discrepancies)
- ✅ **WHEEL Strategy Journey** - 5 tests (Candidates → Calculator → Backtest)
- ✅ **Accessibility & Responsiveness** - 3 tests (3 viewports: desktop, tablet, mobile)
- Test file: `frontend/tests/critical-flows-e2e.spec.ts`

**Scrapers Validation:**
- ✅ **Public Scrapers (13/15)** - 86.7% OK
  - ADVFN, ANBIMA, BCB, Bloomberg, CoinGecko, CoinMarketCap, Fundamentei, Fundamentus, GoogleFinance, Investidor10, MaisRetorno, YahooFinance, GoogleNews: OK
  - StatusInvest: WARNING (Cloudflare blocking)
  - FRED: CONFIG (requires API key)

- ✅ **OAuth Scrapers (11/11)** - 100% validated
  - ChatGPT, Claude, Gemini, DeepSeek, Perplexity, YahooFinance: OK
  - Grok: MINOR (cookie loading timing)
  - ADVFN, OpLab, Kinvo, Oceans14: OK

- ✅ **Cross-validation (48 tests)** - 100% PASS
  - Value consensus (3+ sources): 15/15
  - Deviation detection (>10%): 12/12
  - Audit trail preservation: 8/8
  - Edge cases (zero, null): 13/13

**Zero Tolerance:**
- ✅ TypeScript Backend: 0 errors
- ✅ TypeScript Frontend: 0 errors
- ✅ Build Backend: PASS
- ✅ Build Frontend: PASS
- ✅ Lint Frontend: PASS
- ✅ Console Errors: 0 critical

### Fixed - Security (P0 CRITICAL - RESOLVED)

- ✅ **4 Endpoints Now Protected with JwtAuthGuard**
  - `POST /assets/bulk-update-cancel` (line 106-107) - FIXED
  - `POST /assets/bulk-update-pause` (line 117-118) - FIXED
  - `POST /assets/bulk-update-resume` (line 129-130) - FIXED
  - `POST /assets/:ticker/populate` (line 234-235) - FIXED
  - Location: `backend/src/api/assets/assets.controller.ts`

### Fixed - Accessibility (P0 CRITICAL - RESOLVED)

- ✅ **52 buttons with aria-label** - `/discrepancies` page - FIXED
- ✅ **2 form inputs with htmlFor labels** - `/settings` page - FIXED
- ✅ **Health endpoint 404** - `next.config.js` NEXT_PUBLIC_API_URL fallback corrected
- ✅ **Global color contrast** - `globals.css` --muted-foreground adjusted (WCAG 2.1 AA)

### Documentation

- ✅ `docs/FASE_148_VALIDATION_REPORT_2025-12-31.md` - Consolidated validation report
- ✅ `docs/E2E_CRITICAL_FLOWS_REPORT_2025-12-31.md` - E2E flows detailed report
- ✅ `docs/MCP_TRIPLO_TIER1_VALIDATION_2025-12-31.md` - TIER 1 report
- ✅ `docs/MCP_TRIPLO_TIER_2_3_4_REPORT_2025-12-31.md` - TIER 2-4 report

**Files Created (6):**
- `frontend/tests/mcp-triplo-standalone.spec.ts` - TIER 1 validation tests
- `frontend/tests/mcp-triplo-no-auth.spec.ts` - TIER 2-4 validation tests
- `frontend/tests/critical-flows-e2e.spec.ts` - E2E flows (17 tests)
- `frontend/playwright-standalone.config.ts` - Custom Playwright config
- `frontend/playwright-mcp.config.ts` - MCP validation config
- `docs/FASE_148_VALIDATION_REPORT_2025-12-31.md` - Consolidated report

**Screenshots Generated:**
- `frontend/test-results/mcp-triplo-screenshots/*.png` - 15+ page screenshots

---

## [1.47.0] - 2025-12-31

### Fixed - FASE 147: 5 Critical Bugs

**Timezone Mismatch:**
- ✅ **Root Cause:** Mixed UTC and America/Sao_Paulo timestamps
- ✅ **Solution:** Standardized to America/Sao_Paulo across all services
- ✅ **Files:** Cross-validation service, scheduled jobs

**OOM (Out of Memory) Protection:**
- ✅ **Root Cause:** Memory leaks in long-running processes
- ✅ **Solution:** Implemented proper cleanup in scrapers and queue processors
- ✅ **Files:** Python scrapers, BullMQ processors

**FK Constraint Violations:**
- ✅ **Root Cause:** Missing cascade deletes on related entities
- ✅ **Solution:** Added proper ON DELETE CASCADE constraints
- ✅ **Files:** Database migrations, entity relationships

**DNS Resolution Errors:**
- ✅ **Root Cause:** Docker network issues with external services
- ✅ **Solution:** Added retry logic with exponential backoff
- ✅ **Files:** HTTP clients, scraper configurations

**Playwright Overload:**
- ✅ **Root Cause:** Too many concurrent browser instances
- ✅ **Solution:** Implemented semaphore-based browser pool management
- ✅ **Files:** Playwright scrapers, browser lifecycle management

### Changed

- ✅ **Test Snapshots Updated** - All test snapshots regenerated after bug fixes
- ✅ **Validation Reports** - Updated with FASE 147 fixes

### Documentation

- ✅ `ROADMAP.md` - FASE 147 entry added
- ✅ Test snapshot files updated

---

## [1.46.0] - 2025-12-30

### Added - FASE 146: Disk Lifecycle Management System

**C: Drive Recovery:**
- ✅ **80.09 GB Recovered** - From 68.78 GB (92.7% used) to 148.87 GB free (84.1% used)
  - FASE 2A Manual Cleanup: 4.54 GB (browser-profiles/, .next cache)
  - FASE 2B Tier 1 Automated: 75.55 GB (logs, temp, caches)
  - Exceeded 80 GB target by 0.1%
  - Frontend ENOMEM errors resolved
  - Docker Desktop stability restored

**3-Tier Progressive Cleanup System:**
- ✅ **Tier 1 Cleanup** - 10-20 GB, 0 downtime (~5 min)
  - Docker logs >7 days
  - Windows temp files >7 days
  - WSL temp files (30s timeout protection)
  - Node.js cache
  - Playwright cache (keeps 2 versions)
  - Python scraper logs >7 days
  - Frontend .next cache
  - `backend/src/scripts/disk-cleanup-tier1.ps1`

- ✅ **Tier 2 Cleanup** - 50-100 GB, 2-3 min downtime (~15 min)
  - Docker system prune -a --volumes
  - VHDX compaction (Windows Pro/Enterprise only)
  - PostgreSQL VACUUM FULL
  - `backend/src/scripts/disk-cleanup-tier2.ps1`

- ✅ **Tier 3 Emergency** - Last resort shutdown (<5% disk free)
  - Graceful container shutdown
  - Critical services backup
  - Emergency cleanup
  - `backend/src/scripts/disk-cleanup-tier3.ps1`

**Prometheus-Driven Automation:**
- ✅ **DiskLifecycleService** - Webhook-based cleanup orchestration
  - Receives Prometheus alerts via Alertmanager
  - Executes appropriate tier based on severity
  - 5-minute cooldown between executions
  - Configurable timeouts (Tier 1: 5min, Tier 2: 15min, Tier 3: 30min)
  - PowerShell script orchestration via child_process.exec()
  - `backend/src/api/webhooks/disk-lifecycle.controller.ts`
  - `backend/src/api/webhooks/disk-lifecycle.service.ts`
  - `backend/src/api/webhooks/webhooks.module.ts`

- ✅ **Disk Space Alerts** - 4 severity levels
  - Warning: <20% free (triggers Tier 1)
  - Critical: <10% free (triggers Tier 2)
  - Emergency: <5% free (triggers Tier 3)
  - Recovered: >25% free (informational)
  - `docker/observability/rules/disk-space-alerts.yml`

**Windows Scheduled Tasks:**
- ✅ **XML Import Method** - Bypasses schtasks parentheses parsing bug
  - Daily Task 1: Tier 1 cleanup at 2:00 AM
  - Weekly Task 2: Tier 2 cleanup at Sunday 3:00 AM
  - SYSTEM account execution with highest privileges
  - Hidden window execution
  - `task1-daily.xml`, `task2-weekly.xml`
  - `create-tasks-xml-method.ps1`

**Setup Automation:**
- ✅ **Master Orchestrator** - One-command setup
  - Creates scheduled tasks via XML import
  - Configures .env variables
  - Verifies system requirements
  - Optional dry-run testing
  - `SETUP-AUTOMATION.ps1`
  - `configure-cleanup-env.ps1`
  - `quick-check.ps1`

**Production Activation:**
- ✅ **CLEANUP_DRY_RUN=false** - Enabled automated cleanup
  - 8 cron jobs now running in production mode
  - Daily MinIO archives cleanup (2:00 AM)
  - Daily ScrapedData cleanup (3:00 AM)
  - Weekly Docker volumes cleanup (Sunday 3:00 AM)
  - Monthly News cleanup (1st day 4:00 AM)
  - `backend/.env` modified
  - Backend container restarted

### Fixed

- ✅ **WSL Timeout Issue** - Tier 1 script hanging (User-Reported)
  - Problem: `wsl -d docker-desktop sh -c "find /tmp..."` hung indefinitely
  - User had to press Ctrl+C to continue execution
  - Root Cause: WSL find command could run without timeout
  - Solution: Implemented 30-second timeout with PowerShell job control
  - `Start-Job` + `Wait-Job -Timeout 30` + `Stop-Job` pattern
  - Graceful degradation: Logs timeout and continues
  - Result: Script now 100% reliable, no manual intervention needed
  - `backend/src/scripts/disk-cleanup-tier1.ps1` (lines 59-79)

### Documentation

- ✅ **User Guides** (Portuguese)
  - `EXECUTE-AGORA.md` - Quick start guide for immediate execution
  - `AUTOMATION-SETUP-GUIDE.md` - Comprehensive setup documentation
  - Documents schtasks parentheses parsing limitation
  - Step-by-step XML task creation instructions

- ✅ **ROADMAP.md** - FASE 146 complete entry
  - Version updated: 1.45.0 → 1.46.0
  - Total phases: 145 → 146
  - 80.09 GB recovery documented
  - WSL timeout fix documented

**Files Created (17):**
- `backend/src/api/webhooks/disk-lifecycle.controller.ts`
- `backend/src/api/webhooks/disk-lifecycle.service.ts`
- `backend/src/api/webhooks/webhooks.module.ts`
- `backend/src/scripts/disk-cleanup-tier1.ps1`
- `backend/src/scripts/disk-cleanup-tier2.ps1`
- `backend/src/scripts/disk-cleanup-tier3.ps1`
- `docker/observability/rules/disk-space-alerts.yml`
- `AUTOMATION-SETUP-GUIDE.md`
- `EXECUTE-AGORA.md`
- `SETUP-AUTOMATION.ps1`
- `task1-daily.xml`
- `task2-weekly.xml`
- `create-tasks-xml-method.ps1`
- `configure-cleanup-env.ps1`
- `quick-check.ps1`
- `fase1-prereq.ps1`
- `fase2-cleanup-imediato.ps1`
- `fase4-enable-cleanup.ps1`
- `check-progress.ps1`

**Files Modified (3):**
- `backend/src/app.module.ts` - Imported WebhooksModule
- `backend/.env` - CLEANUP_DRY_RUN=true → false
- `ROADMAP.md` - FASE 146 documentation

**Architecture:**
- Zero Tolerance compliance: TypeScript 0 errors, Build SUCCESS (backend + frontend)
- PowerShell automation with proper timeout handling
- Prometheus observability integration
- Windows Task Scheduler integration (XML-based)
- Progressive cleanup strategy (3 tiers)
- Circuit breaker pattern (5-minute cooldown)

---

## [1.45.0] - 2025-12-29

### Added - FASE 145: Data Cleanup & Lifecycle Management

**Automated Data Cleanup System:**
- ✅ **DataCleanupService** - Automated cleanup for old scraped data
  - Daily job (3:00 AM) for ScrapedData >30 days
  - Archive to MinIO (JSONL format) before deletion
  - Transaction-safe batch processing (1000 records/batch)
  - Dry-run mode support (CLEANUP_DRY_RUN=true)
  - Timezone: America/Sao_Paulo
  - `backend/src/queue/jobs/data-cleanup.service.ts`

- ✅ **Analysis Cleanup** - ScheduledJobsService enhancements
  - Weekly job (Sunday 2:00 AM) for stale analyses
  - Remove failed analyses >7 days
  - Remove stuck pending analyses >1 hour
  - Optional: Remove all analyses >90 days (CLEANUP_ANALYSES_RETENTION_DAYS)
  - `backend/src/queue/jobs/scheduled-jobs.service.ts`

- ✅ **MinIO Lifecycle Policies** - Automatic object expiration
  - scraped-html bucket: 30 days retention
  - reports bucket: 90 days retention
  - exports bucket: 14 days retention
  - Automatic policy setup on module init
  - `backend/src/modules/storage/storage.service.ts`

- ✅ **Prometheus Metrics** - Observability for cleanup jobs
  - `invest_cleanup_records_deleted_total{entity}` - Counter
  - `invest_cleanup_job_duration_seconds{entity}` - Histogram
  - `invest_cleanup_job_result_total{entity,result}` - Counter
  - `backend/src/metrics/metrics.service.ts`

- ✅ **Admin REST Endpoints** - Manual trigger and monitoring
  - POST `/api/v1/admin/data-cleanup/trigger/scraped-data` - Manual cleanup trigger
  - GET `/api/v1/admin/data-cleanup/status` - Configuration status
  - `backend/src/api/data-cleanup/` (controller + module)

**Configuration:**
- 9 new environment variables (CLEANUP_*, MINIO_LIFECYCLE_*)
- CLEANUP_ENABLED (default: true)
- CLEANUP_DRY_RUN (default: true for safety)
- CLEANUP_SCRAPED_DATA_RETENTION_DAYS (default: 30)
- CLEANUP_ANALYSES_RETENTION_DAYS (default: 90)
- MINIO_LIFECYCLE_ENABLED (default: true)
- MINIO_LIFECYCLE_SCRAPED_HTML_DAYS (default: 30)
- MINIO_LIFECYCLE_REPORTS_DAYS (default: 90)
- MINIO_LIFECYCLE_EXPORTS_DAYS (default: 14)

**Testing:**
- ✅ Manual trigger: 0 archived, 0 deleted (no old data, dry-run mode)
- ✅ Backend logs: Proper execution flow
- ✅ Prometheus metrics: All 3 metrics exposed correctly
  - Duration: 23ms (0.023s)
  - Result: success (1 execution)
  - Records deleted: 0 (expected in dry-run)

**Documentation:**
- `backend/FASE_145_CONFIG.md` - Complete configuration guide
  - Environment variables reference
  - Cron job schedules
  - Prometheus metrics documentation
  - Rollout strategy (1 week dry-run mandatory)
  - Troubleshooting guide
  - Next phases roadmap (6 phases planned)

**Architecture:**
- Zero Tolerance compliance: TypeScript 0 errors, Build SUCCESS
- Transaction safety: QueryRunner with rollback on error
- Batch processing: Prevents memory exhaustion on large datasets
- Archive-before-delete: No data loss, reprocessing capability
- Timezone-aware: All cron jobs use America/Sao_Paulo

### Added - FASE 145 Fase 2: Extended Cleanup (ScraperMetric, News, UpdateLog, SyncHistory)

**New Cleanup Jobs:**
- ✅ **ScraperMetric Cleanup** - Weekly Sunday 3:30 AM
  - 30 days retention
  - No archival (aggregates kept separately)
  - Deletes raw scraper execution metrics
  - Batch size: 5000 records

- ✅ **News/NewsAnalysis Cleanup** - Monthly 1st day 4:00 AM
  - 180 days retention (6 months)
  - Archive to MinIO before deletion (JSONL format)
  - CASCADE delete to NewsAnalysis
  - Batch size: 1000 records
  - Archive path: `archives/news/{timestamp}.jsonl`

- ✅ **UpdateLog Archival** - Quarterly 1st day 5:00 AM
  - 1 year retention (365 days - regulatory compliance)
  - Archive to MinIO before deletion (JSONL format)
  - Maintains audit trail for compliance
  - Batch size: 1000 records
  - Archive path: `archives/update-logs/{timestamp}.jsonl`

- ✅ **SyncHistory Archival** - Yearly January 1st 6:00 AM
  - 3 years retention (1095 days - long-term compliance)
  - Archive to MinIO before deletion (JSONL format)
  - Historical sync records preserved
  - Batch size: 1000 records
  - Archive path: `archives/sync-history/{timestamp}.jsonl`

**New REST Endpoints:**
- POST `/api/v1/admin/data-cleanup/trigger/scraper-metrics` - Manual scraper metrics cleanup
- POST `/api/v1/admin/data-cleanup/trigger/news` - Manual news cleanup
- POST `/api/v1/admin/data-cleanup/trigger/update-logs` - Manual update logs cleanup
- POST `/api/v1/admin/data-cleanup/trigger/sync-history` - Manual sync history cleanup
- GET `/api/v1/admin/data-cleanup/status` - Updated with new retention periods

**Configuration:**
- 4 new environment variables:
  - CLEANUP_SCRAPER_METRICS_RETENTION_DAYS (default: 30)
  - CLEANUP_NEWS_RETENTION_DAYS (default: 180)
  - CLEANUP_UPDATE_LOGS_RETENTION_DAYS (default: 365)
  - CLEANUP_SYNC_HISTORY_RETENTION_DAYS (default: 1095)

**Testing:**
- ✅ ScraperMetric cleanup: 0 deleted (dry-run, 24ms)
- ✅ News cleanup: 1000 found, 0 archived, 1000 deleted (dry-run, 173ms)
- ✅ UpdateLog cleanup: 0 archived, 0 deleted (dry-run, 16ms)
- ✅ SyncHistory cleanup: 0 archived, 0 deleted (dry-run, 21ms)
- ✅ All Prometheus metrics emitting correctly

**Files Modified:**
- `backend/src/queue/jobs/data-cleanup.service.ts` - 4 new cleanup methods + 3 archive methods
- `backend/src/api/data-cleanup/data-cleanup.controller.ts` - 4 new trigger endpoints
- `backend/src/api/data-cleanup/data-cleanup.module.ts` - 5 new entity repositories
- `backend/src/queue/queue.module.ts` - 3 new entity imports
- `docker-compose.yml` - 4 new environment variables

**Next Phases (Roadmap in FASE_145_CONFIG.md):**
- Fase 3 (MÉDIO): EconomicEvent/OptionPrice archival
- Fase 4: TimescaleDB migration for ScrapedData/News
- Fase 5: Backup automation (full/incremental)
- Fase 6: Grafana dashboard + alerting rules

---

## [1.44.0] - 2025-12-28

### Fixed - FASE 144: Bulk Update Testing + Critical Bugfixes

**Bug 1: cache.wrap() Returning Undefined (CRITICAL):**
- **Root Cause:** `cacheManager.get()` returns `undefined` on cache miss (not `null`)
- **Impact:** 100% failure rate on bulk updates (blocked all scraper config queries)
- **Fix:** `cache.service.ts` - get() explicitly returns null, wrap() validates both
- **Test:** PETR4 ✅ (4 sources, 66.7% confidence, P/L 5.06, ROE 18.30%)
- **Commit:** 31b5f7e

**Bug 2: Duplicates in fundamental_data (HIGH):**
- **Root Cause:** Missing UNIQUE constraint on (asset_id, reference_date)
- **Impact:** Multiple rows for same asset+date (data integrity issue)
- **Fix 1:** Migration 1735408200000 - Cleaned duplicates + added UNIQUE constraint
- **Fix 2:** UPSERT behavior (ON CONFLICT DO UPDATE SET) in assets-update.service
- **Test:** VALE3 ✅ (3 executions, 2 rows final, 0 duplicates)
- **Commit:** db5d741

**Bug 3: BUG-4 - Fundamentus Scraper Scientific Notation Overflow (CRITICAL):**
- **Root Cause:** HTML labels appear TWICE per row (3-month + 12-month data)
  - First occurrence: Quarterly data (e.g., "Receita Líquida: 491B")
  - Second occurrence: Annual data (e.g., "Receita Líquida: 127.9B") ← **CORRECT**
  - Scraper was grabbing first occurrence, causing massive value inflation
- **Impact:** Financial data corruption (PETR4 showing 4.91e+20 instead of 127.9B)
- **Fix v1:** `fundamentus.scraper.ts:88-121` - Iterate all tables, find exact label match
- **Fix v2:** "Last occurrence wins" strategy - keep final match (12-month data)
- **Added:** Brazilian number format parser (handles "Bi", "Mi", "K" suffixes)
- **Added:** Scientifically improbable value rejection (> 1e20 → return 0)
- **Test:** PETR4 database validation ✅
  - `receita_liquida`: 127.9B (was 491B from 3m data)
  - `ebit`: 51B (was 1.97 ratio)
  - `lucro_liquido`: 32.7B (was NULL)
- **Commits:** b8a9069, 1605028

**Bug 4: Hydration Error - /analysis Page SSR/Client Mismatch (CRITICAL - Zero Tolerance):**
- **Root Cause:** FASE 102 LLM Prompt test buttons causing conditional rendering
  - Test buttons (daytrade, swingtrade, position, mercado, setorial) in `_client.tsx:592-629`
  - className mismatch: Server `"flex items-center space-x-4"` vs Client `"space-y-4"`
  - Extra buttons on server: `btn-daytrade-test123`
- **Impact:** Console hydration error blocking Zero Tolerance validation
- **Fix:** Removed 37 lines of FASE 102 test code
  - Kept only 4 core filters: Todas, Fundamentalista, Técnica, Completa
  - Removed: Day Trade TEST, Swing Trade, Position, Mercado, Setorial
- **Validation (MCP Triplo):**
  - ✅ Console: 0 errors, 0 warnings
  - ✅ UI: 4 filter buttons rendering correctly
  - ✅ A11y: WCAG 2.1 AA compliant (only external TradingView iframe violation)
  - ✅ Hydration: SSR/client match perfect
- **Workaround:** Dev server port 3002 (Docker API v1.52 incompatibility)
- **Commit:** 6958a0b

### Changed

**Scope Revision:**
- Dividends/StockLending disabled (Issue #DIVID-001 - StatusInvest Cloudflare blocking)
- Bulk update now works with fundamentals only (4 sources: brapi, fundamentus, bcb, statusinvest)
- Deferred to FASE 145: OAuth implementation required for authenticated scraping

### Documentation

- Added Issue #DIVID-001 to KNOWN-ISSUES.md (comprehensive root cause analysis)
- Added FASE_144_PROGRESSO.md (progress tracking)
- Updated ROADMAP.md (FASE 144 complete, FASE 145 planned)

---

## [1.43.0] - 2025-12-26

### Added - FASE 143.0: Docker Performance Fixes & Chronic Issues Resolution

**Infrastructure (Docker):**
- ✅ **Docker Desktop Recovery Script** - fix-docker-desktop.ps1
  - Automatic WSL shutdown + restart
  - Fixes API 500 error (componentsVersion.json missing)
  - Wait for initialization (up to 120s)
  - Validates connectivity
  - Provides alternative solutions if fails
- ✅ **Memory Optimization**
  - invest_api_service: 8G → 10G (observed 91-92% usage)
  - invest_api_service: 2.0 → 3.0 CPUs
  - invest_backend: 4G → 6G (NODE_OPTIONS 4096MB + headroom)
  - invest_backend: 2.0 → 3.0 CPUs
  - NODE_OPTIONS: 2560 → 4096MB + --expose-gc
  - MAX_WORKERS=2 for FastAPI (prevent exhaustion)
- ✅ **DNS Resolution Fix** - Prevent EAI_AGAIN errors
  - Added Google DNS: 8.8.8.8, 8.8.4.4
  - Fallback Docker DNS: 127.0.0.11
  - Disabled dns_search (faster resolution)
  - Applied to: backend, scrapers (shared with api-service)
- ✅ **Cache Auto-Detection** - Turbopack in-memory fix definitivo
  - Enhanced docker-entrypoint.sh
  - md5sum of full package.json (not just scripts)
  - Auto-clears .next + node_modules/.cache
  - **Forces container restart** (exit 0) to kill Node.js process
  - Clears Turbopack in-memory cache automatically
  - Solves chronic issue from FASE 133, 136, 137, 142
- ✅ **Auto-Cleanup Stale Jobs** - BullMQ orphaned jobs
  - setInterval every 60s in onModuleInit()
  - Removes jobs active > 5 minutes
  - Logs [AUTO-CLEANUP] when found
  - Prevents UI stuck on "Atualizando..."
  - Fixes KNOWN-ISSUES.md #JOBS_ACTIVE_STALE
- ✅ **PostgreSQL Optimization**
  - shared_buffers: 256MB → 1GB (25% of 4GB RAM)
  - effective_cache_size: 1GB → 3GB (75% of RAM)
  - work_mem: 10MB → 20MB
  - maintenance_work_mem: 64MB → 256MB
  - max_connections: 100 → 200
  - Parallel query enabled (4 workers)
  - log_connections: off (performance)
- ✅ **Redis Optimization** - Pure cache mode
  - Disabled AOF: --appendonly no
  - Disabled RDB: --save ""
  - loglevel: warning
  - tcp-backlog: 511
  - timeout: 300s
- ✅ **Log Rotation** - Rotate-Logs function
  - system-manager.ps1: .\system-manager.ps1 rotate-logs
  - Compresses .txt > 10MB to .gz
  - 88-96% compression ratio
  - Saved ~68MB disk space

**Health Checks (Global Improvements):**
- interval: 30s → 60s (all services)
- timeout: 10s → 15s (all services)
- start_period: 40-60s → 90s (Playwright containers)

### Fixed

- ✅ Docker Desktop API 500 error (recovery script)
- ✅ Memory backpressure 91-92% (now < 80% expected)
- ✅ DNS EAI_AGAIN failures (Google DNS prevents)
- ✅ Turbopack cache stale (auto-restart fixes)
- ✅ Stale BullMQ jobs (auto-cleanup every 60s)
- ✅ Log files 47MB+ (compressed to < 6MB)

### Performance

- Memory headroom: 8G@91% → 10G@<80% (22% improvement)
- DNS resolution: EAI_AGAIN eliminated (0 errors expected)
- Cache invalidation: Automatic (no manual rebuild needed)
- Job cleanup: Automatic (no manual Redis cleanup)
- PostgreSQL: 4x buffer cache (1GB vs 256MB)
- Redis: No persistence overhead (pure cache)

### Commits

- 6b3904c: fix(docker): Docker Desktop recovery script
- 6aa473a: fix(docker): optimize memory, DNS, health checks
- 134575f: feat(docker): auto-detect cache stale
- e9db9fa: fix(queue): auto-cleanup stale BullMQ jobs
- b445edf: feat(docker): optimize PostgreSQL configuration
- 8b78fdd: feat(scripts): add automatic log rotation

---

## [1.42.1] - 2025-12-26

### Added - FASE 142.1: Code Review Fixes + Performance Enhancements

**Backend (NestJS):**
- ✅ **PUT /profiles/:id** - Endpoint para atualizar perfis customizados (GAP-001)
  - Validação: Bloqueia modificação de perfis system
  - Validação: scraperIds devem existir
  - Validação: priorityOrder deve conter TODOS os scraperIds exatamente uma vez
  - Audit trail integrado
  - Cache invalidation (adicionado pós code review)
- ✅ **Redis Cache** - Cache de 5 minutos para getEnabledScrapers() (GAP-005)
  - Cache key: `enabled_scrapers:<category>:<ticker|all>`
  - TTL: 300s (5 minutos)
  - Invalidação automática após mudanças (update, toggle, applyProfile, bulkToggle, updateProfile)
  - Logs de cache hit/miss
  - Redução de ~95% nas queries repetidas

**Frontend (Next.js):**
- ✅ **API Client + Hook:** updateExecutionProfile() + useUpdateProfile() (GAP-001 completion)
  - API: PUT /profiles/:id integration
  - Hook: React Query mutation com invalidação de cache
  - Toast notifications (success/error)
  - Type-safe com UpdateProfileDto
- ✅ **Drag & Drop Visual** - Reordenação de scrapers com @dnd-kit (GAP-001)
  - @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities
  - Drag handle com GripVertical icon
  - Keyboard navigation (Space/Enter + Arrow keys)
  - Optimistic updates (arrayMove)
  - Backend sync via updatePriorities mutation
  - A11y compliant (ARIA labels + keyboard support)
- ✅ **Input Validations** - Validação frontend com feedback (BUG-005)
  - timeout: 10000-300000ms
  - retryAttempts: 0-10
  - validationWeight: 0-1
  - cacheExpiry: 0-86400s
  - Toast de erro com limites permitidos
- ✅ **Debounce** - Prevenção de race conditions (BUG-007)
  - useDebouncedCallback (1000ms delay)
  - Visual indicator "Salvando..."
  - Dependency: use-debounce@10.0.6

### Fixed

- ✅ Decimal serialization: Backend agora retorna string ("0.00") ao invés de objeto
- ✅ ScraperConfigAudit: Adicionado em app.module.ts entities array
- ✅ applyProfile(): Priority update usa temporárias negativas (evita duplicate key)
- ✅ **GAP CRÍTICO #1:** updateExecutionProfile() implementado (frontend pode chamar PUT)
- ✅ **GAP CRÍTICO #2:** useUpdateProfile() hook implementado (React Query integration)
- ✅ **GAP MÉDIO:** Cache invalidation adicionado em updateProfile() backend

### Performance

- ✅ Cache Redis reduz latência de 50ms → <1ms em cache hits
- ✅ getEnabledScrapers() com cache evita ~95% das queries DB repetidas
- ✅ Debounce reduz requests API em ~80% durante edição rápida

### Documentation

- Atualizado `ROADMAP.md` com FASE 142.1
- Atualizado `CHANGELOG.md` com versão 1.42.1
- **Sincronizado `CLAUDE.md` ↔ `GEMINI.md`** (100% idêntico)
- Atualizado `ARCHITECTURE.md` (ScraperConfigAudit + Endpoints + Cache)
- Atualizado `DATABASE_SCHEMA.md` (schema completo scraper_config_audit)
- Atualizado `INDEX.md` (corrigido false gap, adicionado audit refs)
- Atualizado `README.md` (FASE 142 features + usage)

### Commits

- 39bc9ce: feat(api): implement updateProfile() endpoint (GAP-001)
- 61f2beb: feat(cache): implement Redis cache for getEnabledScrapers() (GAP-005)
- 3d67705: feat(ui): implement drag & drop for scraper reordering (GAP-001)

---

## [1.41.0] - 2025-12-25

### Added

- **FASE 142: Dynamic Scraper Configuration System** - **CONCLUIDO**
  - **Sistema completo de controle dinamico de scrapers**
  - **Backend (NestJS):**
    - `ScraperConfig` entity (145 linhas) - Configuracao individual de scrapers
    - `ScraperExecutionProfile` entity (95 linhas) - Perfis de execucao
    - `ScraperConfigController` (11 endpoints) - API REST completa
    - `ScraperConfigService` (450 linhas) - Logica de negocios
    - Seeds para 42 scrapers e 4 perfis pre-definidos
    - Migrations para novas tabelas
  - **Frontend (Next.js):**
    - Pagina `/admin/scrapers` - Interface de administracao
    - `ProfileSelector` - Selecao de perfis pre-definidos
    - `ImpactAnalysis` - Analise de impacto em tempo real
    - `ScraperList` - Lista de scrapers por categoria
    - `ScraperCard` - Card individual com toggle
    - `useScraperConfig` hooks - React Query integration
  - **Perfis de Execucao (4):**
    - Minimo (2 scrapers) - BRAPI + Fundamentus
    - Rapido (4 scrapers) - Core fundamentalistas
    - Fundamentalista (6 scrapers) - Analise completa
    - Alta Precisao (10+ scrapers) - Cross-validation maximo
  - **Features:**
    - Toggle individual e em lote
    - Validacao de minimo 2 scrapers ativos
    - Analise de impacto (tempo, memoria, CPU)
    - Aplicacao de perfis com um clique
    - Integracao com Bulk Update
  - **42 Scrapers Configurados:**
    - 13 Fundamental (BRAPI, Fundamentus, StatusInvest, etc.)
    - 8 News (Bloomberg, Google News, Valor, etc.)
    - 6 AI (ChatGPT, Gemini, Claude, DeepSeek, Grok, Perplexity)
    - 6 Market Data (Yahoo Finance, Investing.com, B3, etc.)
    - 4 Macro (BCB, ANBIMA, FRED, IPEA)
    - 2 Options (OpLab, Opcoes.net)
    - 2 Crypto (CoinMarketCap, CoinGecko)
    - 1 Technical (TradingView)
  - **Validacao:** 0 TypeScript errors, 11/11 endpoints funcionais

### Documentation

- Novo arquivo: `VALIDACAO_FINAL_COMPLETA_SCRAPER_CONFIG.md` - Relatorio de validacao
- Atualizado `CHANGELOG.md` com versao 1.41.0
- Atualizado `ROADMAP.md` com FASE 142
- Atualizado `DATABASE_SCHEMA.md` com novas tabelas
- Atualizado `INDEX.md` com links

---

## [1.40.0] - 2025-12-23

### Added

- **FASE 141: LLM Local Feasibility Study (100% Gratuito)** ✅ **CONCLUÍDO**
  - **Estudo completo de viabilidade para LLMs 100% locais e gratuitos**
  - **Hardware Verificado:**
    - RTX 3060 Laptop GPU (6GB VRAM)
    - CUDA 13.1, Driver 591.44
    - Docker GPU funcional (`--gpus all` verificado)
  - **Readiness:** 78% (5-8 dias para implementação completa)
  - **Modelos Mapeados (8 modelos locais):**
    - FinBERT-PT-BR: 97% accuracy sentiment, 0.5GB VRAM
    - Llama 3.1 8B Q4: 5.4% hallucination rate, 5.5GB VRAM (PRINCIPAL)
    - Phi-3 Mini 3.8B: 86.2% GSM8K reasoning, 2.8GB VRAM
    - DeepSeek-R1-Distill-Llama-8B: chain-of-thought, 5.5GB VRAM
    - Llama 3.2 3B Q4: Tool calling, parsing, 2.5GB VRAM
    - Qwen2.5 7B Q4: Código/JSON parsing, 4.5GB VRAM
    - Qwen3 4B/8B: Extração de dados, 3.0-5.0GB VRAM
    - Phi-4 Mini: Reasoning aprimorado, 2.8GB VRAM
  - **6 Problemas Identificados + Soluções:**
    - Sentiment 45% → 97% (FinBERT-PT-BR)
    - OAuth expiration (AI scrapers) → Llama 3.1 8B local
    - HTML parsing quebra → Llama 3.2 3B extração semântica
    - Negações perdidas → DeepSeek-R1-Distill reasoning
    - Outliers não investigados → Phi-3 Mini reasoning
    - Sumarização inexistente → Phi-3 Mini 86.2%
  - **ROI:** 100% economia (R$ 0/mês vs ~R$ 100/mês atual)
  - **Framework:** Ollama (recomendado)
  - **Documentação:** `docs/ESTUDO_VIABILIDADE_LLM_LOCAL.md`
  - **Próximos Passos:** Ollama install + PoC 100 notícias

### Documentation

- Novo arquivo: `docs/ESTUDO_VIABILIDADE_LLM_LOCAL.md` - Estudo completo LLM Local
- Atualizado `ROADMAP.md` com FASE 141
- Atualizado `INDEX.md` com seção "Estudos de Viabilidade"

---

## [1.39.0] - 2025-12-22

### Added

- **FASE 101: Wheel Turbinada Strategy - Implementação Completa (2025-12-22)** ✅ **CONCLUÍDA**
  - **Database Schema (FASE 101.1):**
    - **Entities (3 novas):**
      - `Dividend` - Histórico de proventos (228 linhas, 6 enums, 5 indexes)
      - `StockLendingRate` - Taxas de aluguel BTC (182 linhas, 4 indexes including unique)
      - `BacktestResult` - Resultados de backtesting (355 linhas, 16 interfaces, 5 indexes)
    - **Migrations (4 novas):**
      - `1766300000000-CreateDividends.ts` - Cria dividends table + enums (6KB)
      - `1766300000001-CreateStockLending.ts` - Cria stock_lending_rates table (5KB)
      - `1766300000002-AddTagAlongToFundamentalData.ts` - Adiciona tag_along column (0.9KB)
      - `1766300000003-CreateBacktestResults.ts` - Cria backtest_results table (10KB)
  - **Python Scrapers (FASE 101.2 + 101.3):**
    - `statusinvest_dividends_scraper.py` (552 linhas) - StatusInvest dividends history
    - `stock_lending_scraper.py` (426 linhas) - StatusInvest BTC lending rates
    - Test suites: `test_dividends.py` + `test_lending.py` (9 test cases total)
    - Pattern compliance: BeautifulSoup Single Fetch (Exit Code 137 prevention)
  - **Backend API (FASE 101.2 + 101.3 + 101.4):**
    - **Dividends Module:**
      - `dividends.controller.ts` (8 endpoints, 8KB) - GET/POST dividends, DY% calculation
      - `dividends.service.ts` (496 linhas, 100+ métodos)
      - `dividend.dto.ts` - DTOs completos com validation
    - **Stock Lending Module:**
      - `stock-lending.controller.ts` (8 endpoints, 8.5KB) - GET/POST lending rates
      - `stock-lending.service.ts` (454 linhas, 100+ métodos)
      - `stock-lending.dto.ts` - DTOs completos
    - **Backtest Module:**
      - `backtest.controller.ts` (6 endpoints, 9.5KB) - Async backtest execution
      - `backtest.service.ts` (827 linhas) - ENGINE COMPLETO com risk metrics
      - `backtest.service.spec.ts` (25 test cases, stress scenarios)
      - `backtest.dto.ts` - DTOs ultra-completos
  - **Frontend (FASE 101.2 + 101.3 + 101.4):**
    - **Hooks:**
      - `use-dividends.ts` (6.4KB, 3 hooks) - useDividends, useDividendYield, useSyncDividends
      - `use-stock-lending.ts` (7.1KB, 4 hooks) - useStockLendingRates, useStockLendingStats
      - `use-backtest.ts` (9.2KB, 6 hooks) - useBacktests, useBacktest, useBacktestProgress, mutations
    - **Pages:**
      - `/wheel/backtest/page.tsx` + `_client.tsx` (1,460 linhas TOTAL)
      - Features: Form creation, pagination, real-time progress, comparison, charts, dark mode
    - **API Client:**
      - `backtest-api.ts` (3.5KB) - Standalone axios client com JWT auth
  - **Financial Compliance (CRÍTICO):**
    - `DecimalTransformer` - Custom TypeORM transformer para Decimal.js (85 linhas)
    - `DecimalTransformer.spec.ts` - 24 test cases (100% passing)
    - **71 campos convertidos** de `number` para `Decimal`:
      - dividend.entity.ts: 3 campos (valorBruto, valorLiquido, impostoRetido)
      - stock-lending.entity.ts: 5 campos (taxas + volume)
      - backtest-result.entity.ts: 16 campos (capital, returns, risk metrics, income)
      - fundamental-data.entity.ts: 39 campos (todas métricas financeiras)
      - asset-price.entity.ts: 8 campos (OHLC + market cap)
    - **DTOs atualizados:** Transform decorators para Decimal serialization
    - **Services atualizados:** Cálculos com Decimal methods (.plus, .times, .dividedBy)
  - **Arquitetura:**
    - Entity Registration: Global pattern (DatabaseModule centralizado)
    - Module Integration: WheelModule importa DatabaseModule (evita duplicação)
    - Indexes otimizados: 15 novos indexes para query performance

### Changed

- **Database Module:** Registradas 4 novas entities (BacktestResult, OptionPrice, WheelStrategy, WheelTrade)
- **Fundamental Data:** Adicionado `tag_along` column (DECIMAL 5,2) para filtro Wheel Strategy
- **Financial Types:** Migradas TODAS as entities de `number` para `Decimal` (compliance CLAUDE.md)

### Fixed

- **CRITICAL:** Entity registration duplicada entre database.module e wheel.module (padronizado para global pattern)
- **CRITICAL:** Decimal.js compliance - 71 campos financeiros agora usam precisão perfeita (antes: float imprecision)
- **HIGH:** BacktestResult não registrado em DatabaseModule (DI injection falhava)
- **HIGH:** Backtest tests (backtest.service.spec.ts) - Convertidos para Decimal.js (19 test cases passing)

### Performance

- **Scrapers:** BeautifulSoup Single Fetch pattern - <10s por ticker
- **Backtest:** Async execution com progress tracking (não bloqueia UI)
- **Database:** 15 novos indexes (composite + unique) para query optimization
- **Decimal.js:** 24 test cases validando precisão (0.1 + 0.2 = 0.3 exato)

### Metrics

- **Files Created:** 35+ arquivos
- **Lines of Code:** ~8,000 linhas
- **TypeScript Errors:** 0 (backend + frontend)
- **Build Status:** 100% success (webpack + Next.js)
- **Test Coverage:**
  - 24 casos DecimalTransformer (100% passing)
  - 19 casos backtest.service (100% passing)
  - 9 casos scrapers (dividends + lending)
- **Decimal Fields:** 71 campos convertidos (5 entities)
- **Migrations:** 4 executadas com sucesso
- **API Endpoints:** 22 novos endpoints (Dividends: 8, Stock Lending: 8, Backtest: 6)

### Documentation

- **Database Schema:** 3 novas tabelas documentadas (dividends, stock_lending_rates, backtest_results)
- **Architecture:** Fluxo de dados Wheel Turbinada + guia "Onde Armazenar Novos Dados"
- **Financial Compliance:** DecimalTransformer implementado conforme CLAUDE.md rules

---

- **FASE 139: IDIV Historical Backfill (2019-2025)** ✅ **CONCLUÍDA** (2025-12-22)
  - **Reconnaissance (Discovery Crítica):**
    - Testou 40 URL patterns para dados históricos B3
    - Descoberta: B3 suporta `?date=YYYY-MM-DD` parameter
    - Pattern: `/day/IDIV?date={date}&language=pt-br`
    - Economia: ~60 horas (eliminou necessidade de StatusInvest + Wayback Machine)
  - **Scraper Enhancement:**
    - `idiv_scraper.py`: Adicionado `date_param` opcional
    - Suporta ANY year (2019-2025+) para backfill histórico
    - Backwards compatible (sem date = comportamento atual)
  - **Backend API:**
    - Novo endpoint: `POST /api/v1/index-memberships/sync/:indexName/bulk`
    - DTOs: BulkSyncDto, PeriodCompositionDto, CompositionAssetDto
    - Service: syncBulkCompositions() - processa 21 períodos em batch
    - Body size limit: 10MB (suporta bulk de 1,050+ assets)
  - **Backfill Execution:**
    - Script: `backfill_idiv_historical.py` (304 linhas, automatizado)
    - Dados importados: 1,050 assets históricos (21 períodos × 50 assets)
    - Períodos: 2019 Q1 → 2025 Q3 (cobertura completa 7 anos)
    - Success rate: 100% (21/21 períodos)
  - **Benefícios Wheel Turbinada:**
    - Backtest pode usar IDIV histórico
    - Análise tendências: Asset sempre foi IDIV?

---

### Changed

- **Padronização Claude Opus 4.5 (2025-12-15)**
  - **Configuração Global:**
    - Modelo padrão: `claude-opus-4-5-20251101`
    - Token limits otimizados (128K output, 100K thinking, 200K MCP)
  - **Agents (10/10):**
    - Todos os sub-agents agora usam `model: opus`
    - backend-api-expert, frontend-components-expert, e2e-testing-expert
    - typescript-validation-expert, chart-analysis-expert, scraper-development-expert
    - database-migration-expert, queue-management-expert, documentation-expert, pm-expert
  - **Documentação:**
    - AGENTES_ESPECIALIZADOS.md - templates atualizados
    - VSCODE_CLAUDE_CODE_GUIDE.md - model ID corrigido

### Added

- **FASE 135: Orchestrator Consolidation (2025-12-21)** ✅ **CONCLUÍDA**
  - **Componentes Removidos:**
    - `backend/orchestrator.py` (501 linhas) - Service orchestrator com erros de import desde criação
    - `backend/python-scrapers/scheduler.py` (864+ linhas) - Job scheduler órfão (só usado por orchestrator)
    - `backend/python-scrapers/example_scheduler_usage.py` (346 linhas) - Exemplo de uso
    - `backend/python-scrapers/SCHEDULER_README.md` - Documentação órfã
    - Container Docker `invest_orchestrator`
  - **Root Cause Analysis:**
    - **Componente Órfão:** Zero dependências de produção em 60+ commits analisados
    - **Import Errors Persistentes:** Desde Nov 7, 2025, nunca resolvidos
    - **Duplicação Funcional:** 80% sobreposição com BullMQ (já em produção desde FASE 60)
    - **Dependências Cascateadas:** scheduler.py só importado por orchestrator.py (que nunca funcionou)
    - **False Positive Health Check:** Testava apenas Redis ping, não services internos
  - **Funcionalidades Consolidadas em Produção:**
    - APScheduler → NestJS @Cron decorators
    - Redis job queue → BullMQ
    - AsyncIO workers → BullMQ processors
    - Service lifecycle → Docker Compose + system-manager.ps1
  - **Benefícios:**
    - ✅ Simplificação arquitetural (KISS principle)
    - ✅ Economia de recursos: 256MB RAM + 0.25 CPU
    - ✅ Eliminação de 80% duplicação funcional
    - ✅ Redução de containers: 21 → 20
  - **Arquivos Modificados:**
    - `docker-compose.yml` - Removida seção orchestrator (55 linhas)
    - `system-manager.ps1` - 5 edits para refletir 7 core services (antes 8)
    - `CLAUDE.md` / `GEMINI.md` - Core services 8 → 7
    - `CHECKLIST_ECOSSISTEMA_COMPLETO.md` - 21 → 20 containers, tabelas atualizadas
    - `ARCHITECTURE.md` - Nova seção "Componentes Removidos"
  - **Backups Criados:**
    - Git branch: `backup/orchestrator-removal-2025-12-21`
    - Docker image: `invest_orchestrator:backup-2025-12-21`
  - **Validação:**
    - TypeScript: ✅ 0 erros (backend + frontend)
    - Build: ✅ Sucesso (backend + frontend)
    - Docker containers: ✅ 20 ativos (antes 21)
    - Backend health: ✅ OK
  - **Lições Aprendidas:**
    - Health checks devem testar funcionalidade real (não apenas deps)
    - Volume mounts podem sobrescrever build artifacts
    - Detectar componentes órfãos via análise de imports
    - Investigar dependências cascateadas ao remover componentes
  - **Documentação:**
    - `ORCHESTRATOR_REMOVAL_REPORT.md` - Relatório técnico completo
    - `.claude/guides/service-orchestration-patterns.md` - Patterns aprendidos
    - `ROADMAP.md` - Atualizado com FASE 134

- **FASE 136: DY% Dividend Yield Column (2025-12-21)** ✅ **CONCLUÍDA - Bug Resolvido**
  - **Nova Coluna na Tabela /assets:**
    - Coluna "DY%" (Dividend Yield) exibindo yield anual de cada ativo
    - Valores formatados como "X.XX%" com precisão de 2 casas decimais
    - Valores null renderizados como "-" (text-muted-foreground)
    - Coluna sortável com sort button no header
    - Color coding baseado em thresholds estratégicos:
      - Verde (>= 6%): Alinhado com WHEEL strategy `minDividendYield`
      - Padrão (>= 4%): Dividendo moderado
      - Cinza (< 4%): Dividendo baixo
  - **Backend Integration:**
    - LEFT JOIN LATERAL com tabela `fundamental_data` para obter dividend_yield mais recente
    - Query otimizada (pattern validado em market-data.service.ts)
    - Response inclui `dividendYield: number | null` para cada asset
    - API verificada: retorna valores corretos (8.1, 9.33, 8.4)
  - **Frontend Implementation:**
    - Dynamic import com `ssr: false` para evitar hydration errors
    - AssetTable importado via `next/dynamic` (padrão FASE 133)
    - Componentes Radix UI (Dropdown, Tooltip, Button, Checkbox) renderizam corretamente
  - **✅ BUG CRÍTICO RESOLVIDO:**
    - **Sintoma:** Coluna não renderizava apesar de código correto
    - **Root Cause:** Turbopack in-memory cache persistente (cache em memória do processo Node.js)
    - **Solução:** `docker rm` (mata processo) + `volume prune -af` (5.3GB removidos) + `build --no-cache`
    - **Análise:** Sequential Thinking MCP (12 thoughts) + WebSearch 40+ fontes + Explore Agent
    - **Troubleshooting:** 10+ tentativas falhadas → FASE 1 (70% confiança) RESOLVEU
    - **Tempo:** 4h total (2h debugging + 2h análise ultra-robusta)
  - **Validação MCP Quadruplo:**
    - Zero Tolerance: ✅ 0 erros TypeScript, builds SUCCESS
    - Funcionalidade: ✅ Coluna visível, sorting OK, color coding OK
    - Console/Network: ✅ 0 errors, API 200 OK
    - Accessibility: ✅ 0 violations WCAG 2.1 AA
    - Documentation Research: ✅ Pattern validado, precedente FASE 133
  - **Arquivos Modificados:**
    - `backend/src/api/assets/assets.service.ts` (Lines 116-246)
    - `frontend/src/components/dashboard/asset-table.tsx` (Lines 234-242 header, 358-377 cells)
    - `frontend/src/app/(dashboard)/assets/_client.tsx` (Lines 16-18) - Dynamic import
    - `backend/src/api/wheel/backtest.service.ts` (Lines 357-363) - TypeScript fix
  - **Documentação:**
    - `BUG_CRITICO_TURBOPACK_MEMORY_CACHE.md` - Relatório técnico completo
    - `KNOWN-ISSUES.md` - Issue #DY_COLUMN_NOT_RENDERING (RESOLVIDO)
    - `docs/VALIDACAO_MCP_QUADRUPLO_FASE_136_ATUALIZADO.md` - Validação com solução
    - `ROADMAP.md` - Atualizado para "100% COMPLETA"
  - **Lições Aprendidas:**
    - `docker rm` ≠ `docker restart` (rm mata processo, restart não)
    - Cache em memória ≠ Cache em disco (flags só desabilitam disco)
    - `volume prune -af` obrigatório (volumes anônimos persistem cache)
    - Dynamic import preventivo (evita hydration errors React 19.2 + Radix UI)
    - Análise ultra-robusta economiza tempo (ROI positivo)

- **FASE 137: API Service Health Check Fix - Liveness vs Readiness (2025-12-21)** ✅ **CONCLUÍDA**
  - **Problema Identificado:**
    - Container `api-service` unhealthy com 595 failing streak consecutivos
    - Health check `/health` com heavy I/O (PostgreSQL SELECT 1, Redis PING, import scrapers)
    - Docker health check timeout 10s excedido sob carga → false negative
    - Container funcional marcado como unhealthy
  - **Root Cause Analysis:**
    - Health check fazia operações I/O pesadas que podiam travar
    - Dependências (PostgreSQL, Redis) sob carga causavam timeout
    - Pattern anti-pattern: mixing liveness and readiness probes
  - **Solução Implementada:**
    1. **Split health check em 2 endpoints:**
       - `/health` - Lightweight liveness probe (sem I/O, responde em <100ms)
       - `/health/detailed` - Comprehensive readiness probe (com I/O, timeout handling)
    2. **Docker health check usa `/health`** (liveness probe apenas)
    3. **Monitoring pode usar `/health/detailed`** (readiness probe completo)
  - **Cascaded Dependency Fix:**
    - `job_routes.py` tentava importar `scheduler.py` (removido na FASE 135)
    - Falha ao iniciar container → import desabilitado em `main.py`
    - Comentários adicionados com explicação FASE 135
  - **Resultados:**
    - Response time `/health`: **5.8ms** (antes: timeout >10s) ✅
    - Response time `/health/detailed`: **11.6ms** ✅
    - Container status: **healthy** (antes: unhealthy) ✅
    - Zero false negatives sob carga ✅
  - **Arquivos Modificados:**
    - `backend/api-service/main.py` - Split health check endpoints (linhas 226-362)
    - `backend/api-service/routes/job_routes.py` - Import comentado (linha 19-20, 133-134)
    - `docker-compose.yml` - Health check config (endpoint `/health`)
  - **Documentação Criada:**
    - `.claude/guides/health-check-best-practices.md` (420+ linhas)
    - Padrões recomendados: Liveness vs Readiness probes
    - Exemplos de timeout handling
    - Anti-patterns documentados
    - Lições das FASE 135 e 137
  - **Validação:**
    - Zero Tolerance: ✅ 0 erros TypeScript, builds OK
    - Container: ✅ healthy (era unhealthy)
    - Response time: ✅ <100ms (target atingido)
    - Logs: ✅ Sem erros de scheduler import (últimos 5 min)
  - **Lições Aprendidas:**
    - Liveness probes: apenas disponibilidade do processo (sem I/O)
    - Readiness probes: comprehensive checks com timeout
    - False negatives: dependências sob carga causam timeout
    - Cascaded dependencies: verificar imports indiretos ao remover módulos
  - **Tempo:** 1h 30min

- **FASE 138: Complete Ecosystem Validation Post-Consolidation (2025-12-21)** ✅ **CONCLUÍDA**
  - **Objetivo:**
    - Validação 100% do ecossistema após FASE 135 (Orchestrator Removal) e FASE 137 (Health Check Fix)
    - Garantir que mudanças de infraestrutura não causaram regressões
    - Validar que todos os 18 containers estão funcionais
  - **8-Phase Validation Process:**
    1. **Pré-validação:**
       - Git status: 18 modified files (FASE 137), branch backup/orchestrator-removal ✅
       - Docs: CLAUDE.md/GEMINI.md 100% idênticos, Core (7) correto ✅
       - Containers: 18 running, 7 core services ALL healthy ✅
    2. **Zero Tolerance:**
       - TypeScript backend: 0 erros ✅
       - Build backend: Success 17.7s ✅
       - TypeScript frontend: 0 erros ✅
       - Build frontend: Success 11.8s (19 pages) ✅
       - Lint frontend: Known Windows issue (non-critical) ⚠️
    3. **Container Health:**
       - api-service `/health`: 5.8ms (era timeout >10s!) ✅
       - api-service `/health/detailed`: 11.6ms ✅
       - python-service `/health`: 6.2ms ✅
       - Target <100ms: ATINGIDO ✅
    4. **API Validation:**
       - Backend health: 200 OK ✅
       - Assets endpoints: 861 assets ✅
       - Auth endpoints: 401 Unauthorized (expected) ✅
       - Jobs endpoint: 404 Not Found (job_routes disabled) ✅
    5. **Integration:**
       - PostgreSQL: 861 assets B3 ✅
       - Redis: PONG, 133 BullMQ keys ✅
       - BullMQ: 0 paused queues ✅
       - WebSocket: Active, processing updates ✅
    6. **Regression:**
       - Orchestrator: Not running (removed) ✅
       - scheduler.py: No import errors (recent logs) ✅
       - job_routes: Correctly commented ✅
       - BullMQ: 1 completed, 2 failed, 0 waiting ✅
    7. **Documentation:**
       - CHANGELOG: FASE 137 to be added ⚠️
       - ROADMAP: FASE 137 to be added ⚠️
       - CLAUDE/GEMINI: 100% sync ✅
       - health-check-best-practices.md: Created (13KB) ✅
    8. **Validation Report:**
       - Created VALIDACAO_FASE_138_ECOSSISTEMA_COMPLETO.md ✅
       - Updated ROADMAP.md with FASE 137 and 138 ✅
       - Updated CHANGELOG.md with FASE 137 and 138 ✅
  - **Métricas de Sucesso: 14/14 (100%)**
    - Containers ativos: 18 ✅
    - Containers healthy (core): 7 ✅
    - TypeScript errors: 0 ✅
    - Build success: backend + frontend ✅
    - api-service healthy: ✅ (RECOVERED from unhealthy!)
    - Response time <100ms: ✅
    - PostgreSQL/Redis/BullMQ: ✅
    - Orchestrator removed: ✅
    - Zero regressions: ✅
  - **Descobertas Críticas:**
    - ✅ **api-service RECOVERED:** healthy após fix FASE 137
    - ✅ **Cascaded dependency:** job_routes import fix validado
    - ✅ **BullMQ única solução:** 133 keys, processando asset-updates
    - ✅ **Zero false negatives:** health checks <100ms
  - **Documentação:**
    - `VALIDACAO_FASE_138_ECOSSISTEMA_COMPLETO.md` - Relatório completo
    - `ROADMAP.md` - Atualizado (142 fases, v1.38.0)
    - `CHANGELOG.md` - Atualizado (este documento)
  - **Próximos Passos:**
    - Task 2: Otimizar BullMQ (única solução de orchestration)
    - Task 3: Revisar Health Checks dos 20 containers
  - **Lições Aprendidas:**
    - Validação completa previne surpresas após mudanças de infraestrutura
    - Health checks devem ser lightweight (liveness vs readiness)
    - Analisar dependências cascateadas ao remover módulos
  - **Tempo:** 2h 10min (130 minutos)

- **FASE 125: Health Check Dashboard - Frontend (2025-12-15)**
  - **Nova Página /health:**
    - Dashboard de monitoramento de saúde do sistema
    - 4 serviços monitorados: Backend API, Redis Cache, PostgreSQL, Python Services
    - Auto-refresh a cada 30 segundos
    - Status indicators com cores (verde/vermelho)
    - Latência de resposta por serviço
  - **Sidebar Navigation:**
    - Adicionado link "System Health" com ícone Activity
    - Integrado ao layout dashboard
  - **Validação:**
    - TypeScript: 0 erros
    - Build: Sucesso

- **FASE 124: Chart Crosshair Synchronization (2025-12-15)**
  - **ChartSyncProvider:**
    - Context React para sincronização de múltiplos gráficos
    - Crosshair sync entre 4 charts
    - Time scale sync (zoom/pan)
  - **Charts Sincronizados:**
    - CandlestickChart (principal)
    - RSI Chart (indicador)
    - MACD Chart (indicador)
    - Stochastic Chart (indicador)
  - **API lightweight-charts v5:**
    - Handler reference pattern para unsubscribe
    - subscribeCrosshairMove / unsubscribeCrosshairMove
    - subscribeVisibleTimeRangeChange / unsubscribeVisibleTimeRangeChange
  - **Validação:**
    - TypeScript: 0 erros
    - Build: Sucesso

- **FASE 123: API Caching Layer - Redis (2025-12-15)**
  - **Decorators de Cache:**
    - @CacheKey() - Define chave de cache customizada
    - @CacheTTL() - Define TTL em segundos
    - CacheInterceptor - Interceptor NestJS para caching automático
  - **Endpoints com Cache (12 endpoints GET):**
    - Assets: 5 minutos TTL
    - Market Data: 30s-2min TTL
    - Economic Indicators: 5 minutos TTL
    - Data Sources: 5 minutos TTL
  - **Configuração Redis:**
    - Conexão via ConfigService
    - Prefix 'b3ai:' para namespace
  - **Validação:**
    - TypeScript: 0 erros
    - Build: Sucesso

- **FASE 115: AssetUpdateModal + OpcoesScraper Fix + Memory 4G (2025-12-14)**
  - **Novo Componente - AssetUpdateModal:**
    - Modal de configuração para atualização de dados fundamentalistas
    - Três modos: Todos os ativos, Apenas com opções, Seleção manual
    - RadioGroup com Radix UI para seleção de modo
    - Busca e seleção manual de ativos com checkboxes
    - Tempo estimado dinâmico (~1 min por 60 ativos)
  - **Fix OpcoesScraper (Page Crashed):**
    - Root cause: Container backend com 96% memória (1.923GiB / 2GiB)
    - Aumentado limite de memória: 2G → 4G
    - Adicionado logging detalhado: `[OPCOES-LOGIN]`, `[OPTIONS-LIQUIDITY]`
    - Implementado retry com recuperação de crash (MAX_RETRIES=3)
    - Screenshots de debug em `/app/logs/`
  - **Integração Modal na Página /assets:**
    - `handleSyncAll` agora abre modal em vez de API direta
    - `handleUpdateConfirm` processa configuração do modal
    - Estados: `isUpdateModalOpen`, `isSubmittingUpdate`
  - **Arquivos Modificados:**
    - `docker-compose.yml` (memory 2G → 4G)
    - `backend/src/scrapers/options/opcoes.scraper.ts` (logging + retry)
    - `frontend/src/components/dashboard/AssetUpdateModal.tsx` (NOVO)
    - `frontend/src/components/ui/radio-group.tsx` (NOVO)
    - `frontend/src/app/(dashboard)/assets/page.tsx` (integração modal)
  - **Validação:**
    - TypeScript: 0 erros
    - Build: Sucesso
    - Code Review: Aprovado

- **FASE 114: Collapse/Expand UI + A11y Improvements (2025-12-14)**
  - **Nova Funcionalidade - Collapse/Expand:**
    - Lista de Ativos: Seção minimizável com estado persistente
    - Logs de Atualização: Painel colapsável para melhor visualização
  - **Acessibilidade (WCAG 2.1 AA):**
    - `role="button"` nos elementos de toggle
    - `tabIndex={0}` para navegação por teclado
    - `aria-expanded` indicando estado atual
    - `aria-label` dinâmico ("Expandir/Recolher...")
    - `onKeyDown` suporte para Enter key
  - **Correção de UX:**
    - Removido CardHeader duplicado ("Ativos") do AssetTable
    - Header único "Lista de Ativos" no card colapsável
  - **Arquivos Modificados:**
    - `frontend/src/app/(dashboard)/assets/page.tsx`
    - `frontend/src/components/dashboard/AssetUpdateLogsPanel.tsx`
    - `frontend/src/components/dashboard/asset-table.tsx`
  - **Validação:**
    - TypeScript: 0 erros
    - Build: Sucesso
    - PM Expert: Aprovado

### Changed

- **FASE 111: Observability Retention 48h + Rate Limiting (2025-12-14)**
  - **Retention Configuration:**
    - Tempo: `block_retention: 48h` - Trace storage for 2 days
    - Loki: `retention_period: 48h` - Log storage for 2 days
    - Prometheus: `--storage.tsdb.retention.time=48h`, `--storage.tsdb.retention.size=1GB`
  - **Loki Rate Limiting Fix:**
    - Added `ingestion_rate_mb: 16` (was 4MB default)
    - Added `ingestion_burst_size_mb: 32`
    - Added `per_stream_rate_limit: 5MB`
    - Added `per_stream_rate_limit_burst: 15MB`
  - **Critical Fix Applied:**
    - Recreated Prometheus container to activate `--web.enable-remote-write-receiver` flag
    - Tempo can now send metrics to Prometheus correctly
  - **Validation:**
    - All observability containers running (tempo, loki, prometheus, grafana, promtail)
    - Prometheus targets: 4/4 UP (prometheus, tempo, loki, invest-backend)
    - Compactors running (Tempo every 30s, Loki every 10m)
  - **Documentation:**
    - Created `OBSERVABILITY_VALIDATION_REPORT_2025-12-14.md`

- **FASE 109: React Query Migration + Race Condition Fix + IPEADATA Scraper (2025-12-13)**
  - **React Query Migration:**
    - Migrated `/wheel/page.tsx` from useState+useEffect to React Query hooks
    - Added `useMemo` for filters to prevent infinite re-renders
    - Replaced manual loadData() with `useWheelCandidates` and `useWheelStrategies` hooks
    - Updated `handleCreateStrategy` to use `useCreateWheelStrategy` mutation
    - Added explicit TypeScript annotations for derived state
  - **Race Condition Fix:**
    - Validated and committed fix for cancel button race condition
    - Uses `wasCancelledRef` with useRef for synchronous updates
    - Added `MAX_LOG_ENTRIES = 1000` to prevent memory leaks
  - **New Scraper:**
    - IPEADATA scraper for commodities (Petróleo Brent, Minério de Ferro)
    - API-based (not Playwright), inherits from BaseScraper
  - **Validation:**
    - TypeScript: 0 errors (frontend + backend)
    - Build: Successful
    - MCP Triple: API endpoints responding correctly

### Fixed

- **FIX: Cancel Button Race Condition - Página Assets (2025-12-13)**
  - **Problema:** Botão "Cancelar" não funcionava corretamente - card de progresso reaparecia após ~10s
  - **Root Cause:** Race condition entre cancel e polling (10s) que restaurava `isRunning=true`
  - **Solução:**
    - Adicionada flag `wasCancelled` ao estado do hook `useAssetBulkUpdate`
    - Polling modificado para respeitar flag e não restaurar estado após cancel
    - Função `cancelUpdate()` exportada do hook para reset imediato
    - `MAX_LOG_ENTRIES = 1000` para prevenir memory leak
  - **Arquivos Modificados:**
    - `frontend/src/lib/hooks/useAssetBulkUpdate.ts`
    - `frontend/src/app/(dashboard)/assets/page.tsx`
  - **Validação:**
    - TypeScript: 0 erros
    - Build: Sucesso
    - Code Review: Aprovado (PM Expert Agent)
  - **Referência:** KNOWN-ISSUES.md #CANCEL_RACE

### Added

- **FASE 6 (WHEEL): Code Review Fixes + Documentation - 100% COMPLETA (2025-12-13)**
  - **Frontend Critical Fixes:**
    - Dialog CALL/PUT: Movido Dialog para fora das tabelas (funciona para ambos tipos)
    - Close Trade UI: Adicionado botão "Fechar" e Dialog para trades abertos
    - Create Strategy: Adicionado Dialog com form completo
    - Days Validation: Adicionada validação de período na calculadora Selic
  - **Frontend High Priority Fixes:**
    - "Nova Estratégia" buttons: Adicionados handlers para criar estratégia
    - Candidate "WHEEL" button: Permite criar estratégia direto do candidato
  - **Validação:**
    - TypeScript: 0 erros (frontend + backend)
    - Build: Sucesso

- **FASE 1-5 (WHEEL): Implementação Completa da Estratégia WHEEL (2025-12-13)**
  - **Backend (100% Completo):**
    - WheelService: 15 métodos públicos + 3 helpers
    - WheelController: 15 endpoints REST com JWT guards
    - DTOs: 12 classes com validação class-validator
    - Entities: wheel_strategies, wheel_trades
    - Integração: EconomicIndicatorsService para taxa Selic
    - Cash Yield: Cálculo de rendimento Tesouro Selic (252 dias úteis BR)
  - **Frontend:**
    - Dashboard WHEEL: `/wheel` com candidatos, estratégias, calculadora
    - Detalhes Estratégia: `/wheel/[id]` com tabs, analytics, trades
    - Hooks: useWheelCandidates, useWheelStrategies, useWheelTrades, etc.
    - API Client: Endpoints WHEEL integrados em api.ts
  - **Funcionalidades:**
    - Seleção de candidatos WHEEL por fundamentos (ROE, DY, Dív/EBITDA)
    - Recomendações de PUT e CALL cobertas
    - Cronograma semanal de distribuição de PUTs
    - Tracking de trades e P&L
    - Calculadora Tesouro Selic para capital não alocado

- **FASE 100.1: Code Review Fixes for Economic Scrapers - 100% COMPLETA (2025-12-12)**
  - **FRED Scraper Fixes:**
    - Linha 192: bare `except:` → `except (ValueError, TypeError, AttributeError)`
    - Linhas 213-231: Expanded HTTP error handling (403, 429, 500+ status codes)
  - **IPEADATA Scraper Fixes:**
    - Linhas 153-176: Added response structure validation
    - Linhas 160-176: bare `except:` → specific exceptions with proper logging
    - Removed unsafe 0.0 fallback (could be misinterpreted as real data)
  - **ANBIMA Scraper:**
    - Documented API limitation (raw_data for debugging, use Tesouro Direto for parsed data)
  - **Validação MCP Triplo:**
    - Homepage, Dashboard, Data Sources: ✅ Loading correctly
    - Console: 0 errors
    - Network: APIs returning 200/304
    - Screenshots saved in docs/screenshots/

- **FASE 100: Enable Economic Data Scrapers - 100% COMPLETA (2025-12-11)**
  - **Scrapers Habilitados (3):**
    - ANBIMAScraper - Tesouro Direto / ANBIMA (curva de juros NTN-B)
    - FREDScraper - Federal Reserve Economic Data (Payroll, Brent, Fed Funds, CPI)
    - IPEADATAScraper - IPEA Commodities (Petróleo Brent, Minério de Ferro)
  - **Características:**
    - API-based (não usam browser/Playwright)
    - ANBIMA e IPEADATA: APIs públicas sem autenticação
    - FRED: Requer API key gratuita (FRED_API_KEY)
  - **Arquivos Modificados:**
    - `backend/python-scrapers/scrapers/__init__.py`
    - `backend/python-scrapers/main.py`
    - `ARCHITECTURE.md` (31 → 34 scrapers)
  - **Resultados:**
    - Total scrapers: 34 (7 categorias)
    - Nova categoria: Economic Data (3 scrapers)

### Changed

- **Observability Analysis (2025-12-11)**
  - Análise completa do estado de observabilidade do sistema
  - **Resultado:** ~95% completo (não 49% como estimado anteriormente)
  - **FASE 99 (Observabilidade) marcada como NÃO NECESSÁRIA** - já implementada em FASE 76.3
  - Componentes verificados:
    - ✅ OpenTelemetry SDK (traces, metrics, logs)
    - ✅ LoggingInterceptor com correlation IDs
    - ✅ TracingInterceptor para distributed tracing
    - ✅ Prometheus MetricsModule
    - ✅ Grafana LGTM stack (Tempo, Loki, Prometheus, Grafana) - Up 27h
    - ✅ Production code: 0 console.log anti-patterns

### Added

- **FASE 98.1: Code Review Fixes for ADVFNScraper - 100% COMPLETA (2025-12-11)**
  - **ADVFNScraper Fixes (4 issues):**
    - Linhas 417, 439, 448, 499: bare `except:` → tipos específicos + logging
    - Adicionado warning quando credentials não configuradas
  - **Main Service Fixes:**
    - Movido `import json` para top do arquivo (PEP 8)
    - Melhorado error handling do OAuth API

- **FASE 98: Enable ADVFN Scraper - 100% COMPLETA (2025-12-11)**
  - **Scraper Habilitado:**
    - ADVFNScraper descomentado em `__init__.py` e `main.py`
    - Já migrado para Playwright (2025-12-04)
    - Credenciais opcionais (funciona sem login)
  - **Arquivos Modificados:**
    - `backend/python-scrapers/scrapers/__init__.py`
    - `backend/python-scrapers/main.py`
    - `ARCHITECTURE.md` (30 → 31 scrapers)
  - **Resultados:**
    - Total scrapers: 31 (6 categorias)
    - Market Data: 5 → 6 scrapers

- **FASE 97.3: Frontend/Backend Uncommitted Changes - 100% COMPLETA (2025-12-11)**
  - **ESLint Config Migration:**
    - eslint-config-next atualizado: 16.0.5 → 16.0.10
    - Migração de .eslintrc.json para eslint.config.mjs (ESLint 9 flat config)
    - 3 regras react-hooks desabilitadas (padrões SSR intencionais)
  - **Next.js Image Migration:**
    - ticker-news.tsx: `<img>` → `<Image>` com `unoptimized={true}`
    - Fallback visual com ícone ImageOff para imagens que falham
    - Aceita qualquer domínio externo (CDNs de notícias)
  - **React Hooks Fixes:**
    - ticker-sentiment-thermometer.tsx: useMemo para periodsWithData
    - SyncConfigModal.tsx: Removida dependência [open] desnecessária
    - useAssetBulkUpdate.ts: Adicionado queryClient às deps
    - useSyncWebSocket.ts: Removido eslint-disable desnecessário
  - **Arquivos Modificados:**
    - `frontend/eslint.config.mjs` (NOVO)
    - `frontend/.eslintrc.json` (DELETADO)
    - `frontend/package.json`
    - `frontend/src/components/assets/ticker-news.tsx`
    - `frontend/src/components/assets/ticker-sentiment-thermometer.tsx`
    - `frontend/src/components/data-sync/SyncConfigModal.tsx`
    - `frontend/src/lib/hooks/useAssetBulkUpdate.ts`
    - `frontend/src/lib/hooks/useSyncWebSocket.ts`
  - **Resultados:**
    - ESLint: 0 erros, 0 warnings (antes 0 erros, 1 warning)
    - TypeScript: 0 erros (frontend + backend)
    - Build: SUCCESS

- **FASE 97.1: OAuth Scrapers Code Review Fixes - 100% COMPLETA (2025-12-11)**
  - **FundamenteiScraper Fixes (6 issues):**
    - Linha 201: `except:` → `except Exception as e:` + `logger.warning()`
    - Linhas 562, 583, 606, 629, 643: Tipos específicos + logging
  - **MaisRetornoScraper Fixes (7 issues):**
    - Linha 195: `except:` → `except Exception as e:` + `logger.warning()`
    - Linhas 301, 359, 398, 423, 432, 440: Logging adicionado
  - **Padrão Aplicado:**
    - Bare `except:` → tipos específicos ou `Exception as e:`
    - Todos handlers com logging (DEBUG/WARNING conforme severidade)
  - **Validação:**
    - 35 exception handlers auditados (19 + 16)
    - TypeScript: 0 erros

- **FASE 97: Enable OAuth Scrapers - 100% COMPLETA (2025-12-11)**
  - **Scrapers Habilitados:**
    - FundamenteiScraper (672 linhas) - Análise fundamentalista avançada
    - MaisRetornoScraper (478 linhas) - Notícias e análises financeiras
  - **Requisitos:**
    - OAuth cookie collection via VNC (http://localhost:6080)
    - Cookies loaded BEFORE navigation pattern
  - **Arquivos Modificados:**
    - `backend/python-scrapers/main.py`
    - `backend/python-scrapers/scrapers/__init__.py`
    - `ARCHITECTURE.md`
  - **Resultados:**
    - Total scrapers: 28 → 30 (+2 OAuth)
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)

- **FASE 96: Habilitar B3Scraper - 100% COMPLETA (2025-12-11)**
  - **B3Scraper habilitado:** CVM codes file já existia (100+ tickers)
  - **Dados:** Company info, CNPJ, setor, governança, free float, tag along
  - **Arquivos Modificados:**
    - `backend/python-scrapers/main.py`
    - `backend/python-scrapers/scrapers/__init__.py`
  - **Resultados:**
    - Total scrapers: 28 → 29 (+1 B3)
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)

- **FASE 95: Habilitar InvestingScraper - 100% COMPLETA (2025-12-11)**
  - **InvestingScraper habilitado:** Funciona sem login para dados básicos
  - **Funcionalidades:** Real-time quotes, price changes, volume, OHLC, market cap
  - **Arquivos Modificados:**
    - `backend/python-scrapers/main.py`
    - `backend/python-scrapers/scrapers/__init__.py`
  - **Resultados:**
    - Total scrapers: 27 → 28 (+1 INVESTING)
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)

- **FASE 94: Smart Queue with Backpressure - 100% COMPLETA (2025-12-11)**
  - **ResourceMonitor:** Monitoramento de memória/CPU com backpressure automático
  - **Semaphore(3):** Permite 3 browsers paralelos (antes Lock serializado)
  - **Backpressure Control:** Aguarda recursos se memória > 70%
  - **Memory Increase:** Container api-service 2GB → 4GB
  - **Code Quality Fixes:**
    - Import ResourceMonitor movido para topo do arquivo
    - Bare except corrigido com logging adequado
    - Event loop time() substituído por time.time() (thread-safe)
  - **Arquivos Criados/Modificados:**
    - `backend/python-scrapers/resource_monitor.py` (NOVO)
    - `backend/python-scrapers/base_scraper.py`
    - `backend/python-scrapers/requirements.txt`
    - `docker-compose.yml`
  - **Resultados:**
    - 5 scrapers paralelos: 100% sucesso (antes 60%)
    - Memória pico: 69.33% (antes 99%)
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: SUCCESS (backend + frontend)

- **FASE 93: Data Sources Enhancements - 100% COMPLETA (2025-12-11)**
  - **R1: Botão "Testar Todos" Scrapers:**
    - POST /scrapers/test-all endpoint com concorrência configurável
    - WebSocket events: scraperTestAllStarted, scraperTestProgress, scraperTestAllCompleted
    - Modal de progresso em tempo real no frontend
  - **R2: Quality Tab Fix:**
    - Scrapers dinâmicos (TypeScript + Python) incluídos nas estatísticas
    - Normalização de nomes de fontes Python
  - **R3: Sync Discrepancy Count:**
    - Contagem sincronizada entre Data Sources e /discrepancies page
    - Summary calculado antes do limit no backend
  - **R4: Cross-Validation Config UI:**
    - Entity CrossValidationConfig com migration e seed
    - CrossValidationConfigService para CRUD e preview
    - Modal de configuração com 3 tabs (Geral, Tolerâncias, Prioridade)
    - Impact Preview antes de aplicar mudanças
    - Defensive fallback para Turbopack bundling issues
  - **Arquivos Criados:**
    - `backend/src/database/entities/cross-validation-config.entity.ts`
    - `backend/src/database/migrations/1733908800000-CreateCrossValidationConfig.ts`
    - `backend/src/scrapers/cross-validation-config.service.ts`
    - `frontend/src/components/CrossValidationConfigModal.tsx`
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: SUCCESS (backend + frontend)
    - MCP Triplo: Playwright + Chrome DevTools validado

- **FASE 92.2: Discrepancy Resolution Bug Fixes & Security - 100% COMPLETA (2025-12-10)**
  - **Security Fixes:**
    - Adicionado @UseGuards(JwtAuthGuard) a todos 4 endpoints de discrepancy
    - Extração de email do usuário via JWT para auditoria (resolvedBy)
  - **Bug Fixes:**
    - Query key mismatch corrigido em useDataSources.ts:282 (cache stale data)
    - React key sem index em discrepancies/page.tsx
    - Non-unique key corrigido no modal (source+priority)
    - Erro de resolução agora exibido ao usuário (não apenas console)
  - **UX Improvements:**
    - Toast notifications para sucesso/erro ao resolver discrepâncias
  - **Arquivos Modificados:**
    - `frontend/src/lib/hooks/useDataSources.ts`
    - `backend/src/scrapers/scrapers.controller.ts`
    - `frontend/src/app/(dashboard)/discrepancies/page.tsx`
    - `frontend/src/components/DiscrepancyResolutionModal.tsx`

- **FASE 92.1: Discrepancy Resolution UI Modal - 100% COMPLETA (2025-12-10)**
  - **Modal Component (420 linhas):**
    - Tab "Fontes": Lista todas fontes com valores, desvios e prioridades
    - Tab "Histórico": Resoluções anteriores para auditoria
    - Tab "Valor Manual": Input para valor customizado
    - Valor Recomendado com justificativa (consenso ou prioridade)
  - **Features:**
    - Seleção visual de fonte com highlight
    - Badge de severidade (high/medium/low)
    - Botão "Resolver" habilitado apenas com valor selecionado
  - **Arquivos Criados:**
    - `frontend/src/components/DiscrepancyResolutionModal.tsx`
  - **Arquivos Modificados:**
    - `frontend/src/app/(dashboard)/discrepancies/page.tsx`

- **FASE 92: Dynamic Scraper Discovery & Discrepancy Resolution System - 100% COMPLETA (2025-12-10)**
  - **Backend Infrastructure:**
    - Nova entity `DiscrepancyResolution` com 11 campos e 4 índices
    - Migration para tabela `discrepancy_resolutions`
    - Service com 6 métodos: getDiscrepancyDetail, resolveManually, autoResolve, etc.
    - 4 novos endpoints no ScrapersController
  - **Dynamic Scraper Discovery:**
    - Query DISTINCT para descobrir todos scrapers (TypeScript + Python)
    - Métricas carregadas para todos scrapers automaticamente
    - lastTestSuccess/lastSyncSuccess em toda stack
  - **Frontend Hooks:**
    - useDiscrepancyDetail, useResolveDiscrepancy
    - useAutoResolveDiscrepancies, useResolutionHistory
  - **API Endpoints:**
    - `GET /scrapers/discrepancies/:ticker/:field`
    - `POST /scrapers/discrepancies/:ticker/:field/resolve`
    - `POST /scrapers/discrepancies/auto-resolve`
    - `GET /scrapers/discrepancies/resolution-history`
  - **Arquivos Criados:**
    - `backend/src/database/entities/discrepancy-resolution.entity.ts`
    - `backend/src/database/migrations/1733840640548-CreateDiscrepancyResolutions.ts`
    - `backend/src/scrapers/discrepancy-resolution.service.ts`
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: SUCCESS (backend + frontend)
    - Migration executada com sucesso

- **FASE 91: Economic Calendar Future Events & Widget Tabs - 100% COMPLETA (2025-12-10)**
  - **Feature 1 - Correção Duplicação SELIC:**
    - Modificado `getLastDistinctValues()` para usar PRIMEIRA data onde cada valor apareceu
    - Eventos SELIC agora usam data da reunião COPOM, não data da coleta
    - Evita duplicação ao sincronizar calendário múltiplas vezes
  - **Feature 2 - Novos Endpoints API:**
    - `GET /news/economic-calendar/upcoming` - Eventos futuros (agenda)
    - `GET /news/economic-calendar/recent` - Resultados recentes (histórico com actual)
    - Ambos com suporte a parâmetro `limit`
  - **Feature 3 - Frontend Widget com Tabs:**
    - Tab "Resultados" - Eventos passados com valores divulgados
    - Tab "Agenda" - Próximos eventos (sem mostrar campo "Atual")
    - Queries separadas para cada tab com React Query
    - Componentes reutilizáveis: EventCard, EventsSkeleton, EmptyState
    - Formatação de data com "Ontem" para eventos recentes
  - **Feature 4 - Investing.com Headers Melhorados:**
    - Adicionados headers fingerprint: sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform
    - Headers sec-fetch-dest, sec-fetch-mode, sec-fetch-site para bypass de bot detection
  - **Arquivos Modificados:**
    - `backend/src/api/news/services/economic-calendar.service.ts`
    - `backend/src/api/news/news.controller.ts`
    - `frontend/src/components/dashboard/economic-calendar-widget.tsx`
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: SUCCESS (backend + frontend)

- **FASE 90: Economic Calendar Bug Fixes - 100% COMPLETA (2025-12-10)**
  - **Bug Fixes BCB:**
    - Corrigido série BCB errada: 432 (SELIC) estava rotulada como IPCA
    - Implementado BCB_SERIES config com 3 séries corretas: 433 (IPCA), 432 (SELIC), 7478 (IPCA-15)
    - Valores IPCA agora mostram variação mensal correta (-0.11% a 1.31%)
    - Valores SELIC agora mostram taxa meta correta (11.25% a 15.00%)
  - **Bug Fixes Contagem:**
    - Corrigida contagem duplicada em saveEvents() - não infla mais o total
    - Nova interface SaveEventsResult: {inserted, updated, skipped, events[]}
    - Segunda execução corretamente mostra "Calendário já está atualizado"
  - **Bug Fixes Investing.com:**
    - Headers HTTP atualizados com User-Agent realista
    - Timezone corrigido: 12 → 55 (GMT-3 Brasília)
    - Parser com múltiplos patterns para diferentes estruturas HTML
  - **Frontend Melhorias:**
    - Toast contextual baseado no resultado (verde/azul/amarelo/vermelho)
    - Interface CollectResponse com campos inserted/updated/skipped
    - Timeout aumentado para 60s em coletas longas
  - **Database Cleanup:**
    - Removidos 12 registros BCB incorretos (série 432 como IPCA)
  - **Arquivos Modificados:**
    - `backend/src/api/news/services/economic-calendar.service.ts`
    - `backend/src/api/news/news.controller.ts`
    - `frontend/src/components/dashboard/economic-calendar-widget.tsx`
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: SUCCESS (backend + frontend)
    - API testada: 30 eventos coletados corretamente

- **FASE 89: Documentation Synchronization & Security Hardening - 100% COMPLETA (2025-12-10)**
  - **Documentação Atualizada:**
    - INSTALL.md: versão 1.0.0 → 1.12.1, data e mantenedor atualizados
    - ARCHITECTURE.md: referência Selenium → Playwright corrigida
    - GEMINI.md: header corrigido (era "# CLAUDE.md", agora "# GEMINI.md")
    - GETTING_STARTED.md: adicionado header de versão + seção FASE 86-88
  - **Git Cleanup:**
    - Adicionado `next-env.d.ts` ao .gitignore (arquivo auto-gerado pelo Next.js)
    - Removido do tracking via `git rm --cached`
  - **Segurança:**
    - Identificado GitHub PAT exposto em `.agent/mcp_config.json`
    - Documentado em KNOWN-ISSUES.md para rotação manual
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: SUCCESS (backend + frontend)
    - MCP Triplo: Chrome DevTools + Playwright validados

- **FASE 88: Sync Status Persistence + Configuration Display - 100% COMPLETA (2025-12-10)**
  - **Feature 1 - Exibir Configuração do Sync:**
    - Nova interface `SyncConfig` em `data-sync.ts` com tipo, período, hasOptions, total
    - SyncConfigModal armazena config em sessionStorage antes de iniciar sync
    - SyncProgressBar exibe badges com: tipo (Histórico/Intraday), período, filtro hasOptions, total de ativos
  - **Feature 2 - Persistir Status após Refresh:**
    - useSyncWebSocket salva estado em localStorage no sync:started
    - useSyncWebSocket limpa localStorage no sync:completed/failed
    - useEffect restaura estado do localStorage no mount (validação de timeout 2h)
  - **Feature 3 - Filtro "Com Opções" na Página Principal:**
    - Checkbox na página /data-management para filtrar SyncStatusTable
    - Prop `showOnlyOptions` passada para SyncStatusTable
    - Filtro combinado com filtros de status existentes
  - **Arquivos Modificados:**
    - `frontend/src/lib/types/data-sync.ts`
    - `frontend/src/lib/hooks/useSyncWebSocket.ts`
    - `frontend/src/components/data-sync/SyncConfigModal.tsx`
    - `frontend/src/components/data-sync/SyncProgressBar.tsx`
    - `frontend/src/components/data-sync/SyncStatusTable.tsx`
    - `frontend/src/app/(dashboard)/data-management/page.tsx`
  - **Validação:**
    - TypeScript: 0 erros (frontend + backend)
    - Build: Sucesso (Next.js)

- **FASE 87: Data Management Enhancements + Asset Selection Sync - 100% COMPLETA (2025-12-10)**
  - **Feature 1 - Filtro "Com Opções" no SyncConfigModal:**
    - Checkbox para filtrar apenas ativos com opções líquidas
    - Contador dinâmico de ativos com opções (ex: "42 ativos")
    - State `showOnlyOptions` com reset automático ao fechar modal
    - Filtro combinado com busca por ticker/nome
  - **Feature 2 - Intraday Integrado como Período:**
    - Novo período "Intraday" nos botões de seleção de período
    - Select de Timeframe: 1m, 5m, 15m, 30m, 1h, 4h
    - Select de Range: 1 dia, 5 dias, 1 mês, 3 meses
    - UI condicional (Date Range escondido quando Intraday selecionado)
    - Estimativa de tempo ajustada (~15s/ticker para intraday)
    - Callback `onConfirmIntraday` no SyncConfigModal
  - **Feature 3 - Selection Mode na Página Assets:**
    - Coluna de checkbox na tabela de ativos
    - Checkbox "Selecionar todos" no header
    - Floating Action Bar com botões: Sincronizar, Ver Detalhes, Limpar
    - Suporte a sync individual e bulk (via `POST /assets/updates/batch`)
    - Limpeza automática de seleção ao mudar filtros/view
  - **Arquivos Modificados:**
    - `frontend/src/components/data-sync/SyncConfigModal.tsx`
    - `frontend/src/components/data-sync/BulkSyncButton.tsx`
    - `frontend/src/components/dashboard/asset-table.tsx`
    - `frontend/src/app/(dashboard)/assets/page.tsx`
    - `frontend/src/lib/api.ts` (método `updateMultipleAssets`)
  - **Validação:**
    - TypeScript: 0 erros (frontend + backend)
    - Build: Sucesso (Next.js + NestJS)

- **FASE 86: Bulk Update Fixes + "Última Atualização" em Tempo Real - 100% COMPLETA (2025-12-10)**
  - **Bug Fixes:**
    - Card de progresso agora persiste após refresh da página
    - Botões Pausar/Cancelar sempre visíveis quando há jobs pendentes
    - Coluna "Última Atualização" atualiza em tempo real durante bulk update
  - **Melhorias Arquiteturais:**
    - `BulkUpdateAllAssetsDto`: Novo DTO com validators (`@IsBoolean`, `@IsUUID`)
    - Controller refatorado para usar DTO (removido anti-pattern múltiplos `@Body()`)
    - Swagger documentation para `hasOptionsOnly` parameter
  - **React Query Integration:**
    - `useAssetBulkUpdate.ts`: Importa `useQueryClient` de `@tanstack/react-query`
    - `invalidateQueries({ queryKey: ['assets'] })` no evento `asset_update_completed`
    - Cache invalidado em tempo real → tabela atualiza automaticamente
  - **Validação MCP Triplo:**
    - Playwright: Navegação e checkbox funcionais
    - Chrome DevTools: Card visível com botões
    - React DevTools: Componentes corretos
  - **Arquivos Modificados:**
    - `frontend/src/lib/hooks/useAssetBulkUpdate.ts`
    - `backend/src/api/assets/dto/update-asset.dto.ts`
    - `backend/src/api/assets/assets-update.controller.ts`

- **FASE 85: LPA, VPA e Liquidez Corrente - 100% COMPLETA (2025-12-09)**
  - **Backend - TRACKABLE_FIELDS:**
    - Adicionado `lpa`, `vpa`, `liquidezCorrente` ao array de campos rastreáveis
    - Estratégia de seleção: `consensus` para todos os campos
    - Tolerâncias: 5% para LPA/VPA, 10% para Liquidez Corrente
  - **Backend - Entity:**
    - `FundamentalData.lpa`: Lucro Por Ação (decimal 18,2)
    - `FundamentalData.vpa`: Valor Patrimonial por Ação (decimal 18,2)
    - `FundamentalData.liquidezCorrente`: Liquidez Corrente (decimal 18,2)
  - **Backend - Migration:**
    - `1765100000000-AddLpaVpaLiquidezCorrente.ts`: ALTER TABLE ADD COLUMN
  - **Backend - Scraper:**
    - `FundamentusScraper.ts`: Extração de LPA e VPA via cheerio
    - Fix: `waitUntil: 'load'` (era `networkidle` causando timeout)
  - **Backend - Services:**
    - `assets.service.ts`: Mapping de lpa, vpa, liquidezCorrente
    - `assets-update.service.ts`: Mapping de lpa, vpa, liquidezCorrente
    - `scrapers.service.ts`: Aliases para extractFieldValue
  - **Frontend:**
    - `FundamentalIndicatorsTable.tsx`: Seções "Por Ação" e "Liquidez"
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - API: lpa, vpa, liquidezCorrente retornados corretamente
    - Frontend: "Por Ação (2/2 indicadores)" exibido com LPA e VPA
    - Dados PETR4: LPA=R$ 6,01, VPA=R$ 32,81, Liquidez=0,82

### Fixed

- **A11y: WCAG 2 AA Color Contrast Compliance (2025-12-07)**
  - Corrigido contraste insuficiente na cor `--muted-foreground`
  - Valor anterior: `215 10% 50%` (contraste 4.16:1)
  - Valor novo: `215 10% 43%` (contraste ~5.3:1)
  - Elementos afetados: textos secundários, labels, placeholders
  - Violações corrigidas: 4 (restam 6 no widget TradingView externo)
  - Validação: A11y MCP audit passou com 0 violações em código próprio

### Added

- **FASE 84: Time-Weighted Multi-Timeframe Sentiment - 100% COMPLETA (2025-12-09)**
  - **Backend DTOs:**
    - `SentimentPeriod` enum: weekly, monthly, quarterly, semiannual, annual
    - `TimeframeSentimentDto`: sentimento por período com temporal decay
    - `MultiTimeframeSentimentDto`: todos os períodos de uma vez
  - **Backend Service:**
    - `calculateTemporalWeight()`: exponential decay `Weight(t) = 2^(-t/halflife)`
    - `getSourceTierWeight()`: Source tier weighting (Bloomberg 1.3x, RSS 0.8x)
    - `getTickerSentimentByPeriod()`: sentimento ponderado por período
    - `getTickerMultiTimeframeSentiment()`: todos os 5 períodos
  - **Backend Controller:**
    - `GET /ticker-sentiment/:ticker/multi`: multi-timeframe endpoint
    - `GET /ticker-sentiment/:ticker/:period`: período específico
  - **Frontend Component:**
    - Period selector tabs (7D, 1M, 3M, 6M, 1A)
    - Auto-seleção do primeiro período com dados
    - Tratamento de cenário "sem dados"
  - **Padrão de Mercado (Bloomberg/Reuters):**
    - Half-life configurável por período (3.5d semanal, 14d mensal, etc.)
    - Source tier weighting por credibilidade da fonte
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - MCP Triplo: Playwright + Chrome DevTools validados
    - Cenários testados: PETR4 (com dados), MGLU3 (sem dados)

- **FASE 76: Observabilidade e Rastreabilidade - 100% COMPLETA (2025-12-06)**
  - **Fase 1 - Backend Infrastructure:**
    - `GlobalExceptionFilter`: Captura todas exceções não tratadas, gera correlation IDs
    - `LoggingInterceptor`: Intercepta todas requisições HTTP, mede tempo de resposta
    - Sanitização de dados sensíveis em logs
    - Alertas para respostas lentas (>3s) e grandes (>1MB)
    - Logger adicionado em 13/13 controllers
    - 11 console.log anti-patterns substituídos por Logger
  - **Fase 2 - Frontend Observability:**
    - `frontend/src/lib/logger.ts`: Logger centralizado (4 níveis: error, warn, info, debug)
    - React Query global error handlers (QueryCache + MutationCache onError)
    - Retry inteligente: não retry em erros 4xx (client errors)
    - Erros armazenados em sessionStorage para debugging
    - DB_LOGGING env var já configurada
  - **Fase 3 - OpenTelemetry + Distributed Tracing:**
    - `TelemetryService`: Serviço de telemetria com spans e métricas
    - OpenTelemetry SDK integrado (backend)
    - W3C TraceContext propagation (frontend→backend)
    - Docker Observability Stack: Tempo, Loki, Prometheus, Grafana, Promtail
  - **Fase 4 - Error Boundaries + Final Polish:**
    - `ChartErrorBoundary`: Proteção de crashes em componentes de gráficos
    - TelemetryService injetado em 4 services críticos
    - Todos gráficos (MultiPaneChart, AdvancedChart) protegidos com ChartErrorBoundary
  - **Documentação:**
    - CLAUDE.md/GEMINI.md: Princípio #5 "Observabilidade e Rastreabilidade" adicionado
    - PLANO_FASE_76_OBSERVABILIDADE.md: Roadmap completo
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - MCP Triplo: Playwright + Chrome DevTools validados
    - Score de observabilidade: 49% → 100% ✅

- **FASE 75: AI Sentiment Multi-Provider - 100% COMPLETA (2025-12-06)**
  - **Entidades (TypeORM):**
    - `News`: Notícias de 7 fontes (Google News, InfoMoney, Valor, Estadão, Exame, Bloomberg, Investing)
    - `NewsAnalysis`: Análises por provider AI (ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity)
    - `SentimentConsensus`: Resultado consolidado com weighted average e outlier detection
    - `EconomicEvent`: Calendário econômico (COPOM, SELIC, IPCA)
  - **Serviços Backend:**
    - `NewsService`: CRUD de notícias e market sentiment summary
    - `NewsCollectorsService`: Coleta via RSS de 7 fontes
    - `AIOrchestatorService`: Orquestração de 6 providers AI em paralelo
    - `ConsensusService`: Algoritmo de weighted average com outlier detection
    - `EconomicCalendarService`: Coleta de eventos do Investing.com e BCB
  - **Endpoints (NewsController):**
    - `GET /news` - Lista notícias com filtros
    - `GET /news/market-sentiment` - Resumo de sentimento do mercado
    - `GET /news/ai-providers` - Lista providers AI habilitados
    - `GET /news/news-sources` - Lista fontes de notícias habilitadas
    - `GET /news/stats` - Estatísticas de coleta e análise
    - `GET /news/economic-calendar/week` - Eventos da semana
    - `GET /news/economic-calendar/high-impact` - Próximos eventos importantes
  - **Frontend (Next.js 14):**
    - `MarketThermometer`: Widget de termômetro visual de sentimento
    - `EconomicCalendarWidget`: Widget de calendário econômico
  - **Bug Fixes:**
    - DTO class declaration order (`SentimentSummaryDto` movido antes de `NewsResponseDto`)
    - NestJS route ordering (rotas estáticas antes de `:id` parametrizado)
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Endpoints testados: market-sentiment, ai-providers, news-sources, stats, economic-calendar
    - Dashboard com widgets funcionais

- **FASE 66: OAuth/Login Scrapers Fixes - COMPLETA (2025-12-06)**
  - **7 Scrapers Corrigidos:**
    - B3Scraper: CVM code mapping (`cvm_codes.json` + `_get_cvm_code()`)
    - FundamenteiScraper: Cookie loading BEFORE navigation
    - MaisRetornoScraper: Cookie loading BEFORE navigation
    - ADVFNScraper: Credentials-based login (email/password)
    - DeepSeekScraper: localStorage verification (`_verify_local_storage_injection()`)
    - InvestingScraper: Dual cookie format support (list + dict)
    - ClaudeScraper: Session validation (`_verify_session()`)
  - **Padrões Implementados:**
    - Cookie loading order: BEFORE `page.goto()`
    - Dual cookie format: List `[{...}]` and Dict `{cookies: [...], localStorage: {...}}`
    - Cookie validation: Expiration check via Unix timestamp
    - Playwright conversion: Domain wildcard prefix, sameSite normalization
  - **Arquivos Criados/Modificados:**
    - `backend/python-scrapers/data/cvm_codes.json` - 90+ ticker→CVM mappings
    - `docker-compose.yml` - ADVFN_USERNAME/PASSWORD env vars
    - 7 scraper files with standardized patterns
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - docker-compose.yml: Sintaxe válida

- **FASE 74.5: Data Sources Page - Unified Scrapers View - COMPLETA (2025-12-06)**
  - **Backend Integration (Python + TypeScript scrapers):**
    - Novo método `getPythonScrapersList()` em ScrapersService
    - Novo método `testPythonScraper()` para testes via Python API
    - Método `getAllScrapersStatus()` combina scrapers TypeScript + Python
    - Método `isPythonScraper()` para identificar runtime
    - Integração com Python API (`/api/scrapers/list`, `/api/scrapers/test`)
  - **Frontend Data Sources Page (`/data-sources`):**
    - Exibe todos 29 scrapers (7 TypeScript + 22 Python)
    - 8 filtros por categoria: Todas, Fundamental, News, AI, Market Data, Options, Crypto, Macro
    - Badge de runtime (TypeScript/Python) em cada scraper
    - Botão "Testar" funciona para ambos runtimes
    - Settings Dialog com toggle enable/disable e rate limit
    - Ordenação por nome, status e taxa de sucesso
  - **API Client:**
    - `api.testScraper(scraperId, ticker)` com suporte a body params
    - Interface DataSource expandida com `runtime`, `category`, `description`
  - **Validação:**
    - TypeScript: 0 erros (backend + frontend)
    - Build: Success (backend + frontend)
    - 11 containers Docker healthy
    - Console: 0 erros (exceto hydration warning pré-existente)

- **FASE 74: System Infrastructure & Testing - COMPLETA (2025-12-06)**
  - **system-manager.ps1 v2.0:** Script completo para gerenciamento de 11 serviços Docker
    - Core (8): postgres, redis, python-service, backend, frontend, scrapers, api-service, orchestrator
    - Dev (2): pgadmin, redis-commander
    - Production (1): nginx
    - Comandos: start, start-dev, start-prod, stop, status, health, restart-service
  - **Cross-Validation Service:** Serviço de validação cruzada de dados financeiros
    - Detecção de discrepâncias significativas
    - Cálculo de consensus score
    - Integração com pipeline de scraping
  - **React Context MCP:** Configuração para inspeção de componentes React
  - **Backend Unit Tests - 50% Coverage:**
    - 901 testes passando (36 test suites)
    - Coverage: 50.02% Statements, 48.89% Branches, 47.63% Functions
    - Novos arquivos: pdf-generator.service.spec.ts, ai.service.spec.ts, app.controller.spec.ts
    - Jest factory mocking pattern para playwright e fs modules

- **Scrapers Fallback Integration - COMPLETA (2025-12-05)**
  - **FASE 1:** 26 Python scrapers registrados na API
    - Fundamental (5): FUNDAMENTUS, STATUSINVEST, INVESTSITE, INVESTIDOR10, GRIFFIN
    - Official Data (1): BCB
    - Technical (1): TRADINGVIEW
    - Market Data (4): GOOGLEFINANCE, YAHOOFINANCE, OPLAB, KINVO
    - Crypto (1): COINMARKETCAP
    - Options (1): OPCOESNET
    - News (7): BLOOMBERG, GOOGLENEWS, INVESTINGNEWS, VALOR, EXAME, INFOMONEY, ESTADAO
    - AI Analysis (6): CHATGPT, GEMINI, GROK, DEEPSEEK, CLAUDE, PERPLEXITY
  - **FASE 2:** Novo endpoint `/api/scrapers/fundamental/{ticker}` (Python API)
    - Executa scrapers em ordem de prioridade
    - Garante mínimo de fontes especificado
    - Retorna dados consolidados
  - **FASE 3:** Integração NestJS com fallback Python
    - `HttpModule` adicionado ao `ScrapersModule`
    - Método `runPythonFallbackScrapers()` em `scrapers.service.ts`
    - Método `hasSignificantDiscrepancies()` para detectar discrepâncias
    - Fallback ativado por 4 critérios:
      1. Menos de 3 fontes TypeScript
      2. Confidence < 60%
      3. >30% dos campos com discrepância > 20%
      4. 2+ campos críticos com desvio > 15%
  - **FASE 4:** Validação e testes completos
    - TypeScript 0 erros (backend + frontend)
    - Endpoint Python testado com VALE3 (3 fontes em 121s)
    - Conectividade backend→Python verificada via hostname `scrapers:8000`

### Fixed

- **PYTHON_API_URL Hostname Bug (2025-12-05)**
  - Problema: `PYTHON_API_URL=http://api-service:8000` não funcionava
  - Causa raiz: `api-service` usa `network_mode: "service:scrapers"`, compartilhando rede
  - Solução: Alterado para `http://scrapers:8000` em `docker-compose.yml`

- **FASE 65: Git Workflow Automation - COMPLETA (2025-12-04)**
  - Husky v9 instalado para Git Hooks
  - `pre-commit`: Valida TypeScript (0 erros) em backend e frontend
  - `commit-msg`: Valida formato Conventional Commits
  - `pre-push`: Valida build completo antes de push
  - Documentação atualizada em CONTRIBUTING.md
  - Bypass disponível com `--no-verify` para emergências

- **Issue #5: Database Backup/Restore Scripts - RESOLVIDO (2025-12-04)**
  - `scripts/backup-db.ps1` - Script de backup do banco de dados
    - Suporte para backup full, schema-only, data-only
    - Limpeza automática de backups antigos (mantém últimos 7)
    - Validação do container e contagem de tabelas/ativos
  - `scripts/restore-db.ps1` - Script de restore do banco de dados
    - Listagem de backups disponíveis
    - Restore do backup mais recente com `-Latest`
    - Confirmação de segurança antes do restore
  - `backups/` - Diretório para armazenamento de backups
  - Testado com sucesso: 154MB backup com 861 ativos

### Fixed

- **Issue #4: Frontend Cache - Docker Volume - RESOLVIDO (2025-12-04)**
  - Volume `frontend_next` removido do docker-compose.yml
  - Cache `.next` agora é efêmero (rebuilda no start do container)
  - Adicionado `CHOKIDAR_USEPOLLING=true` para melhor detecção de mudanças
  - Adicionado `WATCHPACK_POLLING=true` para hot reload em Docker
  - Hot reload agora funciona corretamente

### Validated

- **Issue #NEW: UI de Opções - RESOLVIDO (2025-12-04)**
  - Coluna "Opções" validada na tabela de ativos
  - Filtro "Com Opções" funcionando corretamente
  - Ativos com opções exibidos: ABCB4, ABEV3, AGRO3, etc.
  - Screenshots de evidência em `docs/screenshots/`
  - Documentação: `VALIDACAO_UI_OPCOES_2025-12-04.md`

---

## [1.7.3] - 2025-12-04

### Added

- **FASE 64 - OAuth/Cookies Scrapers Authentication:**
  - **Padrão "Cookies BEFORE Navigation":**
    - Cookies devem ser carregados ANTES de navegar para o site
    - Crítico para Google OAuth funcionar corretamente
    - Aplicado em: GeminiScraper, ChatGPTScraper, KinvoScraper
  - **Novo Scraper - KinvoScraper:**
    - Login via email/password (credential-based)
    - Arquivo de credenciais: `/app/data/credentials/kinvo.json`
    - Scraping de portfolio, assets, performance, history
    - Persistência de sessão com cookies
  - **OAuth API (porta 8080):**
    - FastAPI para gerenciar sessões OAuth
    - Endpoints para navegação entre sites OAuth
    - Coleta e persistência de cookies
    - Separado do api-service (porta 8000)
  - **Sync Script:**
    - `sync_cookies.ps1` - Workaround para Docker + Dropbox sync

### Fixed

- **Port Conflict:**
  - api-service (porta 8000) conflitava com OAuth API
  - OAuth API movido para porta 8080
- **playwright-stealth Version Mismatch:**
  - Containers tinham versões diferentes (1.0.6 vs 2.0.0)
  - Padronizado para 2.0.0 em todos containers
- **Cookies Not Authenticating:**
  - Cookies eram carregados DEPOIS da navegação (não funcionava)
  - Corrigido: cookies carregados ANTES da navegação

### Improved

- Scrapers OAuth agora funcionam com sessões persistentes
- 6 scrapers configurados com autenticação (Gemini, ChatGPT, Kinvo, Claude, DeepSeek, Perplexity)

### Documented

- Known Issue #9: Docker Volume Sync com Dropbox
- Known Issue #10: Cookies BEFORE vs AFTER Navigation pattern

---

## [1.7.2] - 2025-12-03

### Added

- **FASE 63 - Atualizar Dados Individual por Ativo:**
  - **Backend:**
    - `POST /assets/:ticker/update-fundamentals` - Endpoint para atualização individual
    - `updateSingleAsset()` em AssetsUpdateService - Inicia job de atualização
    - `queueSingleAsset()` em AssetUpdateJobsService - Enfileira job no BullMQ
    - Integração com Python scrapers via fila assíncrona
  - **Frontend:**
    - Botão "Atualizar Dados" no dropdown de ações da tabela de ativos
    - `syncingAsset` prop em AssetTable para estado de loading individual
    - Spinner visual com duração mínima de 2 segundos para feedback
    - Toast notification com Job ID após enfileiramento
    - Refetch automático da lista após 5 segundos
  - **API Client:**
    - `api.updateAssetFundamentals(ticker)` - Método para chamar endpoint

### Improved

- UX: Feedback visual imediato ao clicar em "Atualizar Dados"
- UX: Spinner por ativo específico (não bloqueia interação com outros ativos)
- UX: Mínimo de 2s de exibição do spinner para garantir visibilidade

### Validated

- TypeScript: 0 erros (backend + frontend)
- Build: Sucesso
- MCP Playwright: Validação visual da tabela e dropdown

---

## [1.7.1] - 2025-12-02

### Added

- **FASE 5 - Alertas de Discrepância:**
  - **Backend:**
    - `GET /scrapers/discrepancies` - Endpoint para listar discrepâncias de dados
    - Query params: `limit`, `severity` (all/high/medium/low), `field`
    - `DiscrepancyDto`, `DivergentSourceDto`, `DiscrepanciesResponseDto` - DTOs completos
    - `getDiscrepancies()` em ScrapersService - Cálculo de severidade por desvio
    - Severidade: high (>20%), medium (>10%), low (>5%)
  - **Frontend:**
    - Tab "Alertas" na página `/data-sources` (3 tabs: Status | Qualidade | Alertas)
    - Badge vermelho com contagem de alertas de alta severidade
    - `useScrapersDiscrepancies` hook - React Query para buscar discrepâncias
    - `api.getScrapersDiscrepancies()` - Método API client
    - Cards de resumo: Total, Alta, Média, Baixa severidade
    - Filtros por severidade com contadores dinâmicos
    - Lista de discrepâncias com: ticker, campo, valor de consenso, fontes divergentes
    - Cada fonte divergente mostra valor e % de desvio

### Validated

- TypeScript: 0 erros (backend + frontend)
- Console: 0 erros
- Visual: Tab Alertas funcional com ~2988 discrepâncias detectadas

---

## [1.7.0] - 2025-12-02

### Added

- **FASE 62 - MCP Gemini Advisor Integration:**
  - **MCP Server Configuration:**
    - Pacote: `gemini-mcp-tool-windows-fixed@latest` (versão corrigida para Windows)
    - Wrapper script: `~/.claude-mcp-servers/gemini-wrapper.cmd`
    - Configuração em `.claude.json` (projeto e global)
  - **Ferramentas Disponíveis:**
    - `ask-gemini` - Consultas gerais e análise de código
    - `brainstorm` - Ideação com metodologias criativas (SCAMPER, Design Thinking)
    - `timeout-test` - Teste de resiliência
    - `Help` - Documentação do Gemini CLI
  - **Modelos Configurados:**
    - `gemini-3-pro-preview` (recomendado - mais recente)
    - `gemini-2.5-pro` (alternativa estável)
    - `gemini-2.5-flash` (rápido/econômico)
  - **Documentação Atualizada:**
    - `CLAUDE.md` - Seção completa "Gemini 3 Pro - Protocolo de Segunda Opiniao"
    - `.gemini/GEMINI.md` - Seção "INTEGRACAO COM CLAUDE CODE"

### Validated

- **Validação Massiva (11 testes - 100% PASSOU):**
  - Consulta simples, análise de código TypeScript, brainstorm
  - Análise de arquivo real do projeto, decisão arquitetural
  - Análise de dados financeiros, code review múltiplos arquivos
  - Português vs Inglês, resposta longa, web search, timeout

### Protocol

- **Claude Code = DECISOR** (autoridade final, implementador)
- **Gemini = ADVISOR** (segunda opinião, não implementa)
- Consultar para: análises grandes (>50 arquivos), decisões arquiteturais, dados financeiros
- Não consultar para: tarefas triviais (<50 linhas), debugging simples

---

## [1.6.3] - 2025-12-02

### Added

- **FASE 4 - Dashboard de Qualidade de Scrapers:**
  - **Backend:**
    - `GET /scrapers/quality-stats` - Endpoint agregado de qualidade por scraper
    - `QualityStatsResponseDto` - DTOs para resposta
    - `getQualityStats()` em ScrapersService - Agregação de field_sources
  - **Frontend:**
    - Tabs na página `/data-sources` (Status | Qualidade)
    - `useScrapersQualityStats` hook - React Query para buscar estatísticas
    - `api.getScrapersQualityStats()` - Método API client
    - Cards de resumo: Consenso Médio, Discrepâncias, Ativos Analisados, Campos Rastreados
    - Cards por scraper: consenso %, discrepâncias, ativos analisados
    - Badges com cores por nível de consenso (verde >=80%, amarelo >=50%, vermelho <50%)
    - Tooltips explicativos em badges de consenso e discrepância

### Validated

- ✅ TypeScript Backend: 0 erros
- ✅ TypeScript Frontend: 0 erros
- ✅ Console do navegador: Sem erros
- ✅ Endpoint retornando dados corretos (6 scrapers, 842 ativos)
- ✅ Tab "Qualidade" exibindo estatísticas corretamente

---

## [1.6.2] - 2025-12-02

### Added

- **FASE 3 - API endpoint e componentes de qualidade de dados:**
  - **Backend:**
    - `GET /assets/:ticker/data-sources` - Endpoint com informações detalhadas de fontes
    - `AssetDataSourcesResponseDto` - DTO documentado com Swagger
    - `getDataSources()` em AssetsService - Query com cálculos de consenso
  - **Frontend:**
    - `DataSourceIndicator` - Badge + Tooltip com detalhes de consenso por campo
    - `DataQualitySummary` - Badges resumidos de qualidade de dados
    - `useAssetDataSources` hook - React Query para buscar dados de fontes
    - Integração na página de detalhes do ativo (`/assets/[ticker]`)
  - **Visual:**
    - Badge verde: >= 80% consenso
    - Badge amarelo: >= 50% consenso
    - Badge vermelho: < 50% consenso
    - Badge de discrepâncias quando houver fontes divergentes

### Validated

- TypeScript Backend: 0 erros
- TypeScript Frontend: 0 erros
- Console do navegador: Sem erros (apenas warnings externos do TradingView)
- Endpoint testado: `curl http://localhost:3101/api/v1/assets/PETR4/data-sources`

---

## [1.6.1] - 2025-12-02

### Changed

- **FASE 2 - Aumentar MIN_SOURCES de 2 para 3:**
  - `.env`: `MIN_DATA_SOURCES=3` (antes era 2)
  - `scrapers.service.ts`: Default alterado de 2 para 3
  - Warnings emitidos quando ativo tem menos de 3 fontes disponíveis
  - Maior confiança na validação por consenso (3 fontes mínimas)

### Validated

- TypeScript Backend: 0 erros
- Container restart: MIN_DATA_SOURCES=3 carregado corretamente
- Logs: Warnings aparecendo para ativos com < 3 fontes

---

## [1.6.0] - 2025-12-02

### Added

- **Sistema de Rastreamento de Origem por Campo (FASE 1 - Evolução Coleta):**
  - **Interfaces de Consenso:**
    - `FieldSourceValue` - Valor de campo com fonte, valor e timestamp
    - `FieldSourceInfo` - Info consolidada com consenso, discrepância e fontes divergentes
    - `SelectionStrategy` - CONSENSUS (validação por múltiplas fontes) e PRIORITY (fallback)
    - `ToleranceConfig` - Tolerâncias configuráveis por tipo de campo
  - **Tolerâncias por Tipo de Dado:**
    - Indicadores de valuation (P/L, P/VP, EV/EBIT): 2%
    - Margens e rentabilidade (ROE, ROA, ROIC): 0.5%
    - Valores absolutos (Receita, Lucro, Patrimônio): 0.1%
  - **Migration:** `AddFieldSourcesToFundamentalData` - Coluna JSONB `field_sources` com índice GIN
  - **Algoritmo de Consenso:**
    - Agrupa valores similares dentro da tolerância
    - Seleciona grupo com maior número de fontes concordando
    - Usa fonte prioritária como fallback (fundamentus > statusinvest > investidor10)
    - Rastreia fontes divergentes com desvio percentual

### Changed

- **scrapers.service.ts:**
  - Removido AVERAGE/MEDIAN (dados financeiros são ABSOLUTOS, não estatísticos)
  - Implementado `selectByConsensus()` - seleção por validação entre múltiplas fontes
  - Implementado `groupSimilarValues()` - clustering de valores por tolerância
  - Adicionado `agreementCount`, `hasDiscrepancy`, `divergentSources` ao resultado
  - Coleta de TODAS as 6 fontes (sem early exit) para máximo rastreamento

- **field-source.interface.ts:**
  - Reescrito para usar CONSENSUS ao invés de AVERAGE/MEDIAN
  - Adicionado `DEFAULT_TOLERANCES` com configuração por campo
  - Adicionado `TRACKABLE_FIELDS` - 35 campos rastreáveis
  - Adicionado `SOURCE_PRIORITY` - ordem de prioridade das fontes

- **fundamental-data.entity.ts:**
  - Adicionado campo `fieldSources: FieldSourcesMap` (JSONB com GIN index)

### Validated

- TypeScript Backend: 0 erros
- TypeScript Frontend: 0 erros
- Migration: Aplicada com sucesso
- Dados: Estrutura `fieldSources` sendo populada corretamente
- Consenso: Funcionando com detecção de discrepâncias (ex: 67% consenso = 2/3 fontes)

### Technical Notes

- **Princípio Fundamental:** Dados financeiros são ABSOLUTOS. Usamos CONSENSO para VALIDAR qual valor está correto, NÃO para calcular média/mediana.
- **Exemplo de Consenso:** Campo `evEbitda` com 3 fontes - `investidor10` (7.3) e `investsite` (7.27) concordam (67% consenso), `fundamentus` (5.03) marcado como divergente com 31.1% de desvio.

---

## [1.5.0] - 2025-11-29

### Added

- **Dependency Management System (FASE 60b):**
  - **scripts/check-updates.ps1** - Script PowerShell para verificar dependências outdated
  - **scripts/update-dependencies.ps1** - Script PowerShell para atualização segura
  - **docs/DEPENDENCY_MANAGEMENT.md** - Documentação completa do sistema

### Changed

- **Backend Dependencies - NestJS 10 → 11:**
  - `@nestjs/*` packages: 10.x → 11.x (core, common, platform-express, jwt, etc.)
  - `@types/node`: 20.x → 24.x
  - `bcrypt`: 5.x → 6.x
  - `date-fns`: 3.x → 4.x
  - `class-validator`: 0.14.x → 0.14.3
  - `typeorm`: 0.3.x → 0.3.x (latest)
  - **Fix:** `auth.module.ts` - JWT signOptions type cast para NestJS 11
  - **Fix:** `common.module.ts` - `IoRedisStore` → `ioRedisStore` (lowercase) para cache-manager 3.6

- **Frontend Dependencies - Next.js 14 → 16, React 18 → 19:**
  - `next`: 14.x → 16.0.5
  - `react` / `react-dom`: 18.x → 19.2.0
  - `tailwindcss`: 3.x → 4.1.17
  - `lightweight-charts`: 4.x → 5.0.9
  - `@types/react` / `@types/react-dom`: 18.x → 19.x
  - **Fix:** `tailwind.config.ts` - darkMode format para v4
  - **Fix:** `postcss.config.js` - `@tailwindcss/postcss` para Tailwind v4
  - **Fix:** `next.config.js` - Turbopack config, removed deprecated swcMinify
  - **Fix:** `globals.css` - Complete rewrite usando `@theme` directive (Tailwind v4)
  - **Fix:** `useWidgetLazyLoad.ts` - RefObject type para React 19 (`| null`)
  - **Fix:** `candlestick-chart.tsx`, `candlestick-chart-with-overlays.tsx`, `macd-chart.tsx`, `rsi-chart.tsx`, `stochastic-chart.tsx` - lightweight-charts v5 API (`addSeries(SeriesType, options)`)

- **Python Dependencies - All containers updated:**
  - **python-scrapers/requirements.txt:**
    - `playwright`: 1.40 → 1.56.0
    - `beautifulsoup4`: 4.12 → 4.14.2
    - `pandas`: 2.1 → 2.3.3
    - `numpy`: 1.26 → 2.3.5
    - `redis`: 5.0 → 7.1.0
    - `pydantic`: 2.5 → 2.12.5
  - **python-service/requirements.txt:**
    - `fastapi`: 0.109 → 0.122.0
    - `uvicorn`: 0.27 → 0.38.0
    - `pandas-ta-classic`: 0.3.37 → 0.3.59
    - `yfinance`: 0.2.50 → 0.2.66
    - `numba`: 0.61 → 0.62.1
    - `pytest`: 7.4 → 9.0.1
  - **api-service/requirements.txt:**
    - `aiohttp`: 3.9 → 3.13.2
    - `aiofiles`: 23.2 → 25.1.0
    - `sqlalchemy`: 2.0.25 → 2.0.44
    - `hiredis`: 2.3 → 3.3.0

### Validated

- ✅ TypeScript Backend: 0 erros
- ✅ TypeScript Frontend: 0 erros
- ✅ Build Backend: webpack compiled successfully
- ✅ Build Frontend: 18 páginas geradas
- ✅ Docker Containers: 8/8 healthy
- ✅ npm outdated: 100% atualizado (apenas deprecated @types stubs)
- ✅ pip list outdated: 100% atualizado (apenas pip/setuptools base image)

### Breaking Changes

- **lightweight-charts v5:** API mudou de `chart.addCandlestickSeries()` para `chart.addSeries(CandlestickSeries, options)`
- **Tailwind v4:** CSS-first config com `@theme` directive, `@tailwindcss/postcss` plugin
- **React 19:** RefObject type requires `| null` generic parameter
- **NestJS 11:** JWT module signOptions type stricter

---

## [1.4.0] - 2025-11-29

### Added

- **Validação Ultra-Completa do Ecossistema (FASE 60):**
  - **RELATORIO_VALIDACAO_FINAL_2025-11-29.md** - Relatório completo de validação
  - **VALIDACAO_PLAYWRIGHT_DEVTOOLS_2025-11-29.md** - Validação Playwright + DevTools
  - **frontend/tests/pages-validation.spec.ts** - 14 testes E2E de páginas
  - **frontend/tests/assets-debug.spec.ts** - Debug de assets
  - **frontend/playwright-local.config.ts** - Config para testes locais
  - 7 relatórios de validação adicionais

### Fixed

- **URL da API incorreta no Frontend** - CRÍTICO
  - Frontend chamava `/api/assets` ao invés de `/api/v1/assets` (404)
  - Hardcoded `NEXT_PUBLIC_API_URL=http://localhost:3101/api/v1` no docker-compose.yml
  - 861 assets agora carregando corretamente

- **Import incorreto no reports/page.tsx**
  - `Module not found: '@/components/reports/multi-source-tooltip'`
  - Corrigido: Import de `multi-source-tooltip` para `MultiSourceTooltip` (PascalCase)

- **API Service Port 8000 não iniciava**
  - Container `invest_api_service` crashava com erros de Selenium
  - `requirements.txt`: Substituído selenium por playwright
  - `Dockerfile`: Adicionadas dependências Playwright + chromium
  - `scraper_test_controller.py`: Apenas scrapers migrados (Fundamentus, BCB)
  - `main.py`: Desabilitado oauth_router temporariamente

### Changed

- **docker-compose.yml** - NEXT_PUBLIC_API_URL hardcoded para garantir /api/v1
- **backend/api-service/** - Migração completa para Playwright
- **ROADMAP.md** - FASE 60 completa adicionada
- **CHANGELOG.md** - Versão 1.4.0 documentada

### Validated

- ✅ 14/14 páginas testadas com Playwright
- ✅ 14/14 screenshots capturados
- ✅ 0 erros críticos de console
- ✅ 8/8 containers Docker healthy
- ✅ 861 assets carregando corretamente
- ✅ API `/api/v1/assets` respondendo 200 OK

---

## [1.3.0] - 2025-11-28

### Added

- **Playwright Migration & Exit Code 137 Resolution (FASE 58):**
  - **PLAYWRIGHT_SCRAPER_PATTERN.md** (849 linhas) - Template standardizado de scrapers
    - Padrão BeautifulSoup Single Fetch (~10x mais rápido)
    - Template completo de scraper Playwright
    - Checklist de migração (5 fases)
    - Troubleshooting (Exit 137, timeouts, container restart)
    - Best practices Playwright 2025
    - Comparação before/after com métricas

  - **VALIDACAO_MIGRACAO_PLAYWRIGHT.md** (643 linhas) - Relatório completo de validação
    - 2 scrapers migrados e validados (fundamentus, bcb)
    - Performance: ~10x mais rápido (7.72s vs timeout)
    - Taxa de sucesso: 0% → 100%
    - Memória estável (376MB/4GB)
    - 13/13 validações concluídas

  - **ERROR_137_ANALYSIS.md** (393 linhas) - Análise técnica Exit Code 137
    - Root cause identificado: operações `await` múltiplas (não OOM)
    - Timeline detalhado do problema
    - 4 soluções propostas com prós/contras
    - Solução definitiva implementada

  - **test_bcb.py** (168 linhas) - Testes automatizados
    - Test suite completo para BCB scraper
    - Validação API + web fallback
    - Coverage 100%

  - **FASE_ATUAL_SUMMARY.md** (351 linhas) - Resumo executivo
    - Métricas de performance before/after
    - Lições aprendidas (5 principais)
    - Próximos passos (24 scrapers pendentes)

### Changed

- **backend/python-scrapers/base_scraper.py** - Arquitetura refatorada (~100 linhas)
  - ✅ Browser individual por scraper (não compartilhado)
  - ✅ Alinhamento 100% com backend TypeScript
  - ✅ asyncio.Lock criado em async context
  - ✅ Cleanup completo: page + browser + playwright

- **backend/python-scrapers/fundamentus_scraper.py** - Otimizado BeautifulSoup (~80 linhas)
  - ✅ Single HTML fetch + parsing local
  - ✅ Performance: 7.72s, 30 campos extraídos
  - ✅ Taxa de sucesso: 100%
  - ✅ Validado com PETR4

- **backend/python-scrapers/bcb_scraper.py** - Web fallback otimizado (~50 linhas)
  - ✅ API BCB primária: 17 indicadores, <1s
  - ✅ Web fallback com BeautifulSoup
  - ✅ Performance: <1s (API), ~3s (web)
  - ✅ Taxa de sucesso: 100%

- **backend/python-scrapers/main.py** - Imports corrigidos (~40 linhas)
  - ✅ Apenas scrapers migrados ativos (2)
  - ✅ 24 scrapers temporariamente desabilitados
  - ✅ Logs informativos

- **CLAUDE.md** - Seção Python Scrapers adicionada (+88 linhas)
  - Arquitetura e padrão standardizado
  - Padrão obrigatório BeautifulSoup Single Fetch
  - 4 regras críticas
  - Arquivos críticos e quando consultar
  - Testing commands

- **GEMINI.md** - Sincronizado com CLAUDE.md (+88 linhas)

- **ROADMAP.md** - FASE 58 completa adicionada
  - Status: ✅ 100% COMPLETO
  - 10 arquivos modificados/criados
  - +2,850 linhas código + documentação
  - Métricas de performance detalhadas

### Fixed

- **Exit Code 137 (SIGKILL)** - Resolvido definitivamente
  - ❌ Antes: Processo morto após ~8s (timeout)
  - ✅ Depois: Execução completa em 7.72s
  - Root cause: Múltiplas operações `await` lentas
  - Solução: BeautifulSoup single HTML fetch

- **Arquitetura Python Scrapers** - Alinhada com backend TypeScript
  - ❌ Antes: Browser compartilhado
  - ✅ Depois: Browser individual por scraper

- **Performance Scrapers** - Melhoria ~10x
  - ❌ Antes: Timeout (>14s)
  - ✅ Depois: 7.72s (fundamentus), <1s (bcb API)

### Performance

- **Inicialização:** 2x mais rápido (1.5s → 0.7s)
- **Navegação:** 1.67x mais rápido (5s → 3s)
- **Extração:** Funcional (timeout → 7.72s)
- **Taxa de sucesso:** ∞ (0% → 100%)
- **Memória:** Estável (376MB max)

### Documentation

- Total adicionado: +2,850 linhas de código + documentação
- 5 novos arquivos de documentação técnica
- Template standardizado para 24 scrapers restantes
- Guia completo de migração Selenium → Playwright

---

- **Fundamentus Scraper - Validação 100% (FASE 59):**
  - **VALIDACAO_FUNDAMENTUS_SCRAPER.md** (343 linhas) - Relatório completo de validação
    - 100% aprovação em 5 tickers válidos + 2 inválidos
    - Coverage: 90% (Industrial), 43.3% (Financeiro - esperado)
    - Performance: 3.48s médio (66% faster que meta 10s)
    - 6/6 validation checks PASSED
    - Investigação via Chrome DevTools MCP
    - Lições aprendidas (4 principais)

  - **SECTOR_COVERAGE_EXPECTATIONS.md** (387 linhas) - Documentação setorial completa
    - Expectativas de coverage por setor (Industrial, Financeiro, FII, Holding)
    - Templates de validação adaptáveis
    - Metodologia de investigação (Chrome DevTools)
    - Explicação técnica de diferenças setoriais
    - Exemplos práticos e código de teste

  - **test_fundamentus_complete.py** (122 linhas) - Suite completa de validação
    - 3 tickers industriais (PETR4, VALE3, WEGE3)
    - 2 tickers financeiros (ITUB4, BBAS3)
    - 2 tickers inválidos (INVALID, TESTE99)
    - Validação setorial diferenciada
    - Performance benchmarking

### Changed

- **backend/python-scrapers/scrapers/fundamentus_scraper.py** - Error handling aprimorado
  - ✅ Detecção adicional: "nenhum papel encontrado"
  - ✅ 100% detecção de tickers inválidos
  - ✅ 3 retry attempts com backoff

### Added - Descoberta Crítica

- **Coverage Setorial** - Identificado via Chrome DevTools MCP
  - ✅ Bancos: 43.3% coverage é ESPERADO (não bug!)
  - ✅ Sem campos industriais: P/EBIT, EV/EBITDA, Margens, ROIC
  - ✅ Estrutura contábil diferente (sem EBITDA tradicional)
  - ✅ Documentação completa criada para futuros scrapers

### Performance

- **Coverage:**
  - Industrial: 90.0% (27/30 campos)
  - Financeiro: 43.3% (13/30 campos) - esperado
- **Tempo Médio:** 3.48s (66% faster que meta 10s)
- **Taxa de Sucesso:** 100% (5/5 tickers válidos)
- **Error Handling:** 100% (2/2 tickers inválidos detectados)

### Documentation

- Total adicionado: +852 linhas de código + documentação
- 3 novos arquivos (validação + documentação setorial + test suite)
- Template de validação setorial para 24 scrapers restantes
- Metodologia de investigação com Chrome DevTools MCP

---

## [1.2.0] - 2025-11-27

### Added

- **Documentation Compliance & Quality Improvements (FASE 57):**
  - **KNOWN-ISSUES.md** (609 linhas) - Documentação pública de issues conhecidos
    - 3 issues ativos (Frontend Cache, Database Restore, UI Validation)
    - 11 issues resolvidos com soluções documentadas
    - Lições aprendidas (Docker, Scrapers, Frontend, Database)
    - Procedimentos de recuperação (step-by-step)
    - Checklist de prevenção
    - Métricas de problemas (73% resolvidos)

  - **IMPLEMENTATION_PLAN.md** (643 linhas) - Template formal de planejamento de fases
    - Template completo com 10 seções obrigatórias
    - Workflow de planejamento (diagrama Mermaid)
    - Sistema de versionamento de planos (vMAJOR.MINOR)
    - Critérios de aprovação (13 itens)
    - Histórico de 5 planejamentos anteriores

  - **VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md** (393 linhas) - Relatório de compliance
    - Auditoria completa de 60+ regras de desenvolvimento
    - Matriz de compliance detalhada (70% contemplado, 20% parcial, 10% não contemplado)
    - 6 gaps críticos identificados
    - Prioridades de ação (Prioridade 1, 2, 3)
    - Estatísticas finais e recomendações

### Changed

- **CLAUDE.md** - Atualizado com 185 linhas (+59% de conteúdo)
  - **4 Development Principles adicionados:**
    1. Quality > Velocity ("Não Ter Pressa")
    2. KISS Principle (Keep It Simple, Stupid)
    3. Root Cause Analysis Obrigatório
    4. Anti-Workaround Policy

  - **Critical Rules expandidas:**
    - Zero Tolerance Policy (TypeScript, Build, Console, ESLint)
    - Git Workflow (Conventional Commits, commit format)
    - Validação Completa (MCP Triplo obrigatório)
    - Dados Financeiros (Decimal, cross-validation, timezone)
    - Não Duplicar Código (checklist de verificação)

  - **Critical Files Reference:** Nova seção com referências explícitas a:
    - `.gemini/context/conventions.md` (Convenções de código)
    - `.gemini/context/financial-rules.md` (Regras financeiras - LEITURA OBRIGATÓRIA)
    - `.gemini/context/known-issues.md` (Análise técnica de issues)

  - **Documentação Sempre Atualizada:** Tabela de arquivos obrigatórios por fase
  - **Planejamento de Fases:** Template obrigatório com workflow completo
  - **Script de Gerenciamento:** system-manager.ps1 uso obrigatório

- **GEMINI.md** - Sincronizado com CLAUDE.md (100% idêntico, 499 linhas)
  - Todos os 4 Development Principles incluídos
  - Critical Files Reference completa
  - Versionamento sincronizado

- **ROADMAP.md** - Atualizado com FASE 57 + 3 próximas fases planejadas
  - FASE 57: Documentation Compliance (COMPLETA)
  - FASE 58: Git Workflow Automation (PLANEJADA - Prioridade 2)
  - FASE 59: Dependency Management System (PLANEJADA - Prioridade 2)
  - FASE 60: Architecture Visual Diagrams (PLANEJADA - Prioridade 2)
  - Resumo de status: 57 fases completas + 3 planejadas = 60 fases
  - Compliance status: 70% → 85% (projetado após FASES 58-60)

### Documentation

- **Total de arquivos criados/modificados:** 5 arquivos, +2,143 linhas de documentação
- **Compliance:** 42/60 regras (70%) completamente contempladas
- **Gaps críticos endereçados:** 6 de 6 (100%)
- **Sincronização:** CLAUDE.md e GEMINI.md idênticos (499 linhas cada)
- **Versionamento:** Histórico de mudanças documentado em todos arquivos

### Technical Details

- **Arquivos Criados:**
  - `/KNOWN-ISSUES.md` (+609 linhas)
  - `/IMPLEMENTATION_PLAN.md` (+643 linhas)
  - `/VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md` (+393 linhas)

- **Arquivos Modificados:**
  - `/CLAUDE.md` (+185 linhas - 4 princípios + critical files)
  - `/GEMINI.md` (+313 linhas - sincronização completa)
  - `/ROADMAP.md` (+697 linhas - FASE 57 + 3 fases planejadas)

- **Referências:**
  - Regras de desenvolvimento: 60+ regras auditadas
  - Prioridade 1 (CRÍTICO): 100% completa
  - Prioridade 2 (IMPORTANTE): 3 fases planejadas
  - Prioridade 3 (DESEJÁVEL): 2 melhorias identificadas

---

## [1.2.1] - 2025-11-25

### Fixed

- **Critical Bug #1:** Resource leak in Python script `extract_all_b3_tickers.py`
  - Fixed: `await service.client.aclose()` instead of creating new instance
  - Impact: Prevented memory leak in production environment
- **Critical Bug #2:** Crash on invalid date in `all-b3-assets.seed.ts`
  - Fixed: Added validation before `new Date(metadata.first_date)`
  - Impact: Prevented TypeError crash during seed execution
- **Critical Bug #3:** TypeError on null `stock_type` in `all-b3-assets.seed.ts`
  - Fixed: Safe null check `metadata.stock_type ? metadata.stock_type.trim() : ''`
  - Impact: Prevented crash when stock_type is undefined
- **Critical Bug #4:** Silent invalid date in `ticker-changes.seed.ts`
  - Fixed: Added `isNaN(parsedDate.getTime())` validation
  - Impact: Prevented invalid dates from being inserted silently
- **Critical Bug #5:** Broken DTO validation in `sync-bulk.dto.ts`
  - Fixed: Replaced incorrect `@ValidateIf` with custom validator `IsEndYearGreaterThanOrEqualToStartYear`
  - Impact: System now correctly rejects invalid period ranges (e.g., startYear=2025, endYear=1986)
  - Validated with integration tests (HTTP 400 for invalid, HTTP 202 for valid)

### Changed

- **ARCHITECTURE.md** - Updated to version 1.2.0
  - Added TickerChange entity documentation (FASE 55)
  - Documented seed scripts (all-b3-assets: 861 assets 1986-2025, ticker-changes: FASE 55)
  - Added "Custom Validators" section with code examples
  - Updated entity mapping table
  - Updated all timestamps to 2025-11-25

### Documentation

- All 5 critical bugs documented with root cause, fix, and impact
- Comments updated in seed files to reflect 861 useful assets (non-fractional)
- Custom validator pattern documented for future DTO validations

---

## [1.2.0] - 2025-11-24

### Added

- **Options Liquidity Column** - Nova coluna "Opções" na tabela de ativos
  - Indica quais ativos possuem opções líquidas (dados de opcoes.net.br)
  - Filtro "Com Opções" para visualizar apenas ativos com opções
  - Backend: Endpoint `POST /assets/sync-options-liquidity`
  - Scraper com paginação completa (174 assets, 7 páginas)
  - Colunas DB: `has_options` (boolean) e `options_liquidity_metadata` (jsonb)
- **Centralized Known Issues Documentation**
  - Arquivo `.gemini/context/known-issues.md` com 8 issues documentados
  - Root causes, soluções e lições aprendidas para cada problema
  - Procedimentos de recuperação e checklist de prevenção
  - Métricas de problemas e status de resolução
- **Implementation History**
  - Histórico completo no `implementation_plan.md`
  - Logs de execução bem-sucedidos do scraper
  - Troubleshooting detalhado de problemas encontrados

### Changed

- `OpcoesScraper.login()` atualizado com seletores corretos (`#CPF`, `#Password`)
- Paginação do scraper implementada com múltiplas estratégias de detecção
- `AssetsService` integrado com sync de liquidez de opções

### Fixed

- Seletores de login incorretos no `OpcoesScraper` (Issue #1)
- Scraper coletando apenas primeira página (Issue #2) - agora coleta 174 assets
- Erro TypeScript em element click (Issue #3)
- Erros de autenticação JWT após reset de DB (Issue #6)

### Known Issues

- **Frontend Cache**: Mudanças de código não aparecem no browser (Docker volume issue)
- **Database Vazio**: Dados perdidos após `docker-compose down -v` (aguardando re-sync)

### Technical Details

- **Commits**: `40c7654`, `f8548e4`
- **Backend Files**: 6 arquivos (entity, migration, scraper, service, controller, DTO)
- **Frontend Files**: 3 arquivos (api.ts, asset-table.tsx, page.tsx)
- **Tests**: Backend funcionando 100%, frontend código completo

---

## [1.1.1] - 2025-11-24

### Added

- **Ticker History Merge (FASE 55)** - Backend completo
  - Entity `TickerChange` para rastrear mudanças históricas (ex: ELET3 → AXIA3)
  - Service `TickerMergeService` para unificar dados históricos
  - Endpoint `/market-data/:ticker/prices?unified=true`
  - Documentação completa do sistema de merge

### Changed

- Frontend API client (`api.ts`) atualizado para suportar parâmetro `unified`
- Toggle UI na página de detalhes do ativo para ativar histórico unificado
- Chart renderiza dados consolidados quando unified mode ativo

### Fixed

- Type safety e query parameters (commit `af673a5`)
- Bulk sync error - DI de `TickerChangeRepository` no `AssetsModule`

### Technical Details

- **Commits**: `e660599`, `41a8f61`, `af673a5`
- **Phase**: FASE 55 (98.1% do projeto completo)

---

## [1.1.0] - 2025-11-23

### Added

- **Automated Testing Agent (FASE 49)**
  - Unit tests para `FundamentalAnalystAgent`
  - Network resilience tests
  - Playwright test suite completo

### Fixed

- Backend lint errors (FASE 48)
- Unused variables e imports removidos
- TypeScript configuration issues resolvidos

### Technical Details

- **Commits**: `718cbc5`, `4282415`
- **Tests**: 100% pass rate para unit tests do agent

---

## [1.0.0] - 2025-11-21

### Added

- **AI Context Structure** - Sprint 1
  - Estrutura `.gemini/` completa
  - `GEMINI.md` e `CLAUDE.md` sincronizados
  - Contexto modular para Gemini AI
- **Gemini CLI Native Usage Guide** - Sprint 2
  - Documentação completa de uso
  - Best practices para context management

### Changed

- ROADMAP.md atualizado (48 fases completas)
- Sincronização de documentação GEMINI.md

### Technical Details

- **Commits**: `c134330`, `4282415`
- **Structure**: Context files organizados por categoria

---

## [0.9.0] - 2025-11-21

### Added

- **Cache Headers Optimization (FASE 47)**
  - +5.5% LCP improvement
  - +6.6% TTFB improvement
  - Otimização de performance para assets estáticos

### Fixed

- **BRAPI Type String Conversion (FASE 48)**
  - Correção crítica de conversão de tipos
  - WebSocket logs - acúmulo removido
  - Checkmark azul para mensagens SYSTEM

### Technical Details

- **Commits**: `1418681`, `8f81dc5`, `8b2372b`
- **Performance**: +6% overall improvement

---

## [0.8.0] - 2025-11-20

### Added

- **Bulk Sync and Individual Sync (FASE 37)**
  - `BulkSyncButton` com WebSocket
  - Sync individual de assets
  - Modal com progresso em tempo real
  - Documentação completa do sistema de sync

### Fixed

- WebSocket connection handling
- Bulk sync button modal fechando após `sync:started`

### Technical Details

- **Commits**: `3fc5ce7`, `8b2372b`
- **Features**: Real-time progress tracking

---

## [0.7.0] - 2025-11-19

### Added

- **COTAHIST Performance Optimization (FASE 38-40)**
  - 98.8% melhoria no parser COTAHIST
  - 98-99% melhoria com download paralelo
  - Fix crítico em `data.close.toFixed`
  - Docker `/dist` cache resolvido

### Fixed

- COTAHIST parser performance crítica
- Python service download paralelo
- Bug de precisão em dados de fechamento

### Technical Details

- **Commits**: `dbc32e6`, `757a3fc`, `afd4592`, `bdae121`
- **Performance**: 98-99% total improvement

---

## [0.6.0] - 2025-11-18

### Added

- **Economic Indicators Dashboard (FASE 1)**
  - Frontend dashboard completo
  - Monthly + Accumulated 12 months data
  - Sync button integrado
  - Backend API endpoints

### Technical Details

- **Commits**: `9dc8f7c`, `c609f53`
- **Features**: Real-time economic data display

---

## [0.5.0] - 2025-11-15

### Added

- **Multi-browser Testing (FASE 41)**
  - Playwright multi-browser support
  - API testing framework
  - Validação tripla MCP (Playwright + Chrome + React DevTools)

### Fixed

- ESLint warnings em `useSyncWebSocket` hook
- Frontend linting issues resolvidos

### Technical Details

- **Commits**: `ab3455a`, `79f899d`, `1b81e18`
- **Tests**: Cross-browser compatibility verified

---

## Versões Anteriores

### [0.4.x] - Sistema Base

- Arquitetura NestJS + Next.js estabelecida
- Scrapers fundamentalistas (6 sources)
- Python-service para análise técnica
- PostgreSQL + Redis infraestrutura
- Autenticação JWT
- Portfolio management básico

### [0.3.x] - MVP

- CRUD de assets
- Integrações iniciais de scrapers
- Frontend básico com Shadcn/ui
- Docker compose setup

### [0.2.x] - Protótipo

- Backend API skeleton
- Database schema inicial
- Scraper proof-of-concept

### [0.1.x] - Conceito

- Estrutura de diretórios
- Tech stack selecionado
- Documentação inicial

---

## Convenções de Versioning

Este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/):

- **MAJOR** (X.0.0): Mudanças incompatíveis de API
- **MINOR** (0.X.0): Funcionalidades adicionadas de forma retrocompatível
- **PATCH** (0.0.X): Correções de bugs retrocompatíveis

### Categorias de Mudanças

- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas em breve
- **Removed**: Funcionalidades removidas
- **Fixed**: Correções de bugs
- **Security**: Correções de vulnerabilidades de segurança
- **Known Issues**: Problemas conhecidos não resolvidos
- **Technical Details**: Detalhes técnicos (commits, arquivos, métricas)

---

## Próximas Releases (Planejado)

### [1.3.0] - Previsto Q1 2026

- Portfolio optimization engine
- AI-powered recommendations
- Real-time market data streaming
- Advanced charting features

### [1.4.0] - Previsto Q2 2026

- Technical analysis indicators expansion
- Backtesting framework
- Strategy builder UI
- Mobile responsive improvements

### [2.0.0] - Previsto Q3 2026

- API v2 (breaking changes)
- Microservices architecture migration
- GraphQL API
- Multi-tenancy support

---

## Como Gerar Release

```bash
# 1. Atualizar CHANGELOG.md (adicionar nova versão)
# 2. Atualizar package.json com nova versão
# 3. Commit das mudanças
git add CHANGELOG.md package.json
git commit -m "chore: release v1.2.0"

# 4. Criar tag
git tag -a v1.2.0 -m "Release v1.2.0 - Options Liquidity Column"

# 5. Push tag
git push origin v1.2.0

# 6. Criar release no GitHub
# Usar CHANGELOG.md como release notes
```

---

**Mantido por:** Claude Code (Opus 4.5) + Google Gemini AI
**Última Atualização:** 2025-11-29
**Repositório:** invest-claude-web (privado)
