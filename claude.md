# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B3 AI Analysis Platform - Investment analysis platform for Brazilian stock exchange (B3) with AI-powered fundamental, technical, and macroeconomic analysis.

**Stack:** NestJS 10 + Next.js 14 App Router + PostgreSQL 16 + TypeORM + BullMQ/Redis + Python Scrapers

## Common Commands

### Development

```bash
# Start all services (Docker)
docker-compose up -d

# TypeScript validation (REQUIRED before commits)
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Build
cd backend && npm run build   # NestJS build
cd frontend && npm run build  # Next.js build

# Lint
cd frontend && npm run lint

# Run tests
cd backend && npm run test                    # Unit tests
cd backend && npm run test:watch              # Watch mode
cd backend && npm run test:e2e                # E2E tests
cd frontend && npx playwright test            # Playwright E2E
```

### Database

```bash
# Run migrations
cd backend && npm run migration:run

# Revert last migration
cd backend && npm run migration:revert

# Generate new migration
cd backend && npm run migration:generate -- -n MigrationName

# Run seeds
cd backend && npm run seed
```

### Docker

```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f <srv>  # View logs (backend, frontend, postgres, redis)
docker restart invest_backend invest_frontend  # Restart services
```

## Architecture

```
Frontend (Next.js :3100) ←→ Backend (NestJS :3101) ←→ PostgreSQL (:5532)
                                    ↓
                              BullMQ + Redis (:6479)
                                    ↓
                           Python Scrapers (Playwright)
```

### Key Directories

- `backend/src/api/` - REST controllers, services, DTOs
- `backend/src/database/entities/` - TypeORM entities
- `backend/src/database/migrations/` - Database migrations
- `backend/src/scrapers/` - Data scraping services (fundamental, news, options)
- `backend/src/queue/` - BullMQ jobs and processors
- `frontend/src/app/(dashboard)/` - Authenticated pages (App Router)
- `frontend/src/components/` - React components (Shadcn/ui)
- `frontend/src/lib/hooks/` - Custom React hooks
- `frontend/src/lib/api.ts` - API client (axios)

### Main Entities

- `Asset` - Stock tickers (861 B3 assets)
- `AssetPrice` - Historical OHLCV data (1986-2025 from COTAHIST)
- `TickerChange` - Ticker rebranding history (e.g., ELET3→AXIA3)
- `Analysis` - Fundamental/technical analysis results
- `Portfolio` / `PortfolioPosition` - User portfolios

## Coding Patterns

### Backend (NestJS)

- Use `class-validator` decorators for DTO validation
- Custom validators with `@ValidatorConstraint` for cross-field validation
- Repository pattern via TypeORM
- WebSocket events via `@nestjs/websockets` for real-time updates

```typescript
// Example: Custom cross-field validator
@ValidatorConstraint({ name: 'IsEndYearGreaterThanStartYear', async: false })
export class IsEndYearGreaterThanStartYear implements ValidatorConstraintInterface {
  validate(endYear: number, args: ValidationArguments) {
    return endYear >= (args.object as any).startYear;
  }
}
```

### Frontend (Next.js 14)

- App Router with route groups: `(dashboard)` for authenticated, `auth` for public
- React Query for server state management
- Shadcn/ui components in `components/ui/`
- Charts: Recharts (dashboard) + lightweight-charts (candlestick)

### Data Flow

1. **Scraping**: 6 sources with cross-validation (min 3 sources for confidence)
2. **Queue**: BullMQ processes heavy tasks (analysis, bulk sync)
3. **Real-time**: WebSocket events for progress updates

## Quality Requirements

**Zero Tolerance Policy:**
- TypeScript: 0 errors (backend + frontend)
- Build: Must succeed
- ESLint: 0 critical warnings

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3100 | http://localhost:3100 |
| Backend API | 3101 | http://localhost:3101/api/v1 |
| PostgreSQL | 5532 | localhost:5532 |
| Redis | 6479 | localhost:6479 |
| PgAdmin | 5150 | http://localhost:5150 |
| noVNC (OAuth) | 6080 | http://localhost:6080 |

## Additional Documentation

- `ARCHITECTURE.md` - Detailed architecture, data flows, entity storage guide
- `DATABASE_SCHEMA.md` - Complete schema, relationships, indexes
- `INSTALL.md` - Full installation guide
- `TROUBLESHOOTING.md` - Common issues and solutions
- `ROADMAP.md` - Development history (55 phases)
