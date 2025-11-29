# Dependency Management - B3 AI Analysis Platform

**Versao:** 1.0.0
**Data:** 2025-11-29
**Autor:** Claude Code (Opus 4.5)
**FASE:** 60 - Dependency Management System

---

## Sumario Executivo

Este documento define o processo completo de gestao e atualizacao de dependencias para a plataforma B3 AI Analysis. O objetivo e manter todas as bibliotecas, frameworks e pacotes atualizados de forma segura e controlada.

---

## Stack de Dependencias

### Backend (NestJS 10)

| Categoria | Principais Pacotes | Versao Atual |
|-----------|-------------------|--------------|
| Framework | @nestjs/* | 10.4.x |
| Database | typeorm, pg | 0.3.x, 8.x |
| Auth | passport, bcrypt, jwt | 0.7.x, 5.x, 10.x |
| Queue | bullmq, ioredis | 5.x, 5.x |
| Validation | class-validator, class-transformer | 0.14.x, 0.5.x |
| API Docs | @nestjs/swagger | 7.4.x |
| Testing | jest | 29.x |

### Frontend (Next.js 14)

| Categoria | Principais Pacotes | Versao Atual |
|-----------|-------------------|--------------|
| Framework | next, react, react-dom | 14.2.x, 18.x |
| State | @tanstack/react-query, zustand | 5.x, 4.x |
| UI | shadcn/ui, tailwindcss, lucide-react | -, 3.x, 0.312.x |
| Charts | recharts, lightweight-charts | 2.x, 4.x |
| Forms | react-hook-form, zod | 7.x, 3.x |
| Testing | playwright | 1.56.x |

### Python Scrapers (Playwright)

| Categoria | Principais Pacotes | Versao Atual |
|-----------|-------------------|--------------|
| Scraping | playwright, beautifulsoup4 | 1.49.x, 4.12.x |
| HTTP | aiohttp, httpx, requests | 3.9.x, 0.26.x, 2.31.x |
| Data | pandas, numpy | 2.1.x, 1.26.x |
| Database | sqlalchemy, psycopg2-binary | 2.0.x, 2.9.x |
| Validation | pydantic | 2.5.x |

---

## Categorias de Updates

### Patch Updates (x.y.Z) - SEGURO

**Frequencia:** Semanal (Sexta-feira)
**Risco:** Baixo
**Processo:** Automatico com validacao

```powershell
# Aplicar patch updates
.\scripts\update-dependencies.ps1 -PatchOnly
```

**Exemplos:**
- `prettier 3.6.2 -> 3.6.3`
- `webpack 5.102.1 -> 5.102.2`
- `class-validator 0.14.2 -> 0.14.3`

### Minor Updates (x.Y.z) - REQUER TESTE

**Frequencia:** Mensal (1o dia do mes)
**Risco:** Medio
**Processo:** Update + Teste manual + Code review

```powershell
# Verificar updates disponiveis
.\scripts\check-updates.ps1

# Aplicar com validacao completa
.\scripts\update-dependencies.ps1
```

**Exemplos:**
- `openai 6.8.1 -> 6.9.1`
- `aiohttp 3.9.1 -> 3.13.2`
- `@tanstack/react-query 5.90.7 -> 5.90.11`

### Major Updates (X.y.z) - REQUER PLANEJAMENTO

**Frequencia:** Sob demanda (mini-fase dedicada)
**Risco:** Alto
**Processo:** Planejamento completo + Migracao + Testes E2E

**Updates Major Pendentes (2025-11-29):**

| Pacote | Current | Latest | Impacto | Prioridade |
|--------|---------|--------|---------|------------|
| **@nestjs/*** | 10.x | 11.x | Breaking changes em decorators | ALTA |
| **react/react-dom** | 18.x | 19.x | Concurrent features, RSC | ALTA |
| **next** | 14.x | 16.x | App Router changes | ALTA |
| **tailwindcss** | 3.x | 4.x | Config breaking changes | MEDIA |
| **zustand** | 4.x | 5.x | API changes | MEDIA |
| **date-fns** | 3.x | 4.x | ESM only | BAIXA |
| **jest** | 29.x | 30.x | Config changes | BAIXA |
| **numpy** | 1.x | 2.x | Array API changes | MEDIA |
| **redis (Python)** | 5.x | 7.x | Async changes | MEDIA |

---

## Scripts Disponiveis

### check-updates.ps1

Verifica dependencias desatualizadas sem modificar nada.

```powershell
# Verificar tudo
.\scripts\check-updates.ps1

# Apenas backend
.\scripts\check-updates.ps1 -Backend

# Apenas frontend
.\scripts\check-updates.ps1 -Frontend

# Apenas Python
.\scripts\check-updates.ps1 -Python
```

### update-dependencies.ps1

Aplica updates de forma segura com validacao.

```powershell
# Dry run (sem modificar)
.\scripts\update-dependencies.ps1 -DryRun

# Aplicar patch updates apenas
.\scripts\update-dependencies.ps1 -PatchOnly

# Aplicar minor/patch updates
.\scripts\update-dependencies.ps1

# Apenas backend
.\scripts\update-dependencies.ps1 -Backend

# Pular testes
.\scripts\update-dependencies.ps1 -SkipTests
```

---

## Workflow de Atualizacao

### Fluxo Padrao (Minor/Patch)

```
1. Criar branch
   git checkout -b chore/update-deps-2025-11-29

2. Verificar updates
   .\scripts\check-updates.ps1

3. Aplicar updates (dry run)
   .\scripts\update-dependencies.ps1 -DryRun

4. Aplicar updates
   .\scripts\update-dependencies.ps1

5. Validacao manual
   - Testar paginas principais
   - Verificar console do browser
   - Testar funcionalidades criticas

6. Commit
   git add -A
   git commit -m "chore(deps): update dependencies 2025-11-29"

7. Push e PR
   git push -u origin chore/update-deps-2025-11-29
   gh pr create --title "chore(deps): update dependencies"

8. Code review
   - Revisar CHANGELOG das libs atualizadas
   - Verificar breaking changes

9. Merge
   gh pr merge --squash
```

### Fluxo Major Update

```
1. Criar PLANO_UPDATE_[PACOTE].md
   - Listar breaking changes
   - Mapear codigo afetado
   - Definir estrategia de migracao
   - Estimar esforco

2. Criar branch dedicada
   git checkout -b feat/upgrade-nestjs-11

3. Aplicar update isolado
   npm install @nestjs/common@11 @nestjs/core@11 ...

4. Corrigir erros TypeScript
   npx tsc --noEmit

5. Executar testes completos
   npm test
   npm run test:e2e

6. Validacao manual extensiva

7. Code review aprofundado

8. Deploy em staging (se disponivel)

9. Merge com squash
```

---

## Checklist Pre-Update

- [ ] Git working tree clean
- [ ] Branch atualizada com main
- [ ] Docker containers healthy
- [ ] TypeScript 0 erros (pre-update)
- [ ] Backup de package*.json

## Checklist Pos-Update

- [ ] TypeScript 0 erros (pos-update)
- [ ] Build sucesso (backend + frontend)
- [ ] Testes passando
- [ ] Console browser sem erros
- [ ] Funcionalidades criticas testadas
- [ ] Commit com mensagem descritiva

---

## Vulnerabilidades de Seguranca

### Verificacao

```powershell
# Backend
cd backend && npm audit

# Frontend
cd frontend && npm audit

# Fix automatico (quando possivel)
npm audit fix

# Fix forcado (cuidado!)
npm audit fix --force
```

### Politica de Seguranca

| Severidade | Acao | Prazo |
|------------|------|-------|
| Critical | Fix imediato | 24h |
| High | Fix prioritario | 48h |
| Moderate | Proximo ciclo | 1 semana |
| Low | Monitorar | Proximo mes |

---

## Monitoramento

### Ferramentas Recomendadas

1. **npm audit** - Vulnerabilidades npm
2. **Dependabot** - PRs automaticos (GitHub)
3. **Snyk** - Analise de seguranca
4. **Renovate** - Atualizacao automatizada

### Configuracao Renovate (Opcional)

```json
// .github/renovate.json
{
  "extends": ["config:base"],
  "schedule": ["before 9am on Monday"],
  "labels": ["dependencies"],
  "automerge": false,
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true
    },
    {
      "matchPackagePatterns": ["@nestjs/*"],
      "groupName": "NestJS packages"
    },
    {
      "matchPackagePatterns": ["react", "react-dom", "next"],
      "groupName": "React ecosystem"
    }
  ]
}
```

---

## Rollback

### Procedimento

```powershell
# Reverter package.json e lock file
git checkout HEAD -- package.json package-lock.json

# Reinstalar dependencias anteriores
npm install

# Verificar
npx tsc --noEmit
npm run build
```

### Rollback Docker

```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d
```

---

## Historico de Updates

| Data | Tipo | Pacotes | Status |
|------|------|---------|--------|
| 2025-11-29 | Inicial | - | FASE 60 criada |

---

## Referencias

- [npm-check-updates](https://github.com/raineorshine/npm-check-updates)
- [Semantic Versioning](https://semver.org/)
- [NestJS Migration Guide](https://docs.nestjs.com/migration-guide)
- [Next.js Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [React 19 Migration](https://react.dev/blog/2024/04/25/react-19)

---

**Documento gerado por Claude Code (Opus 4.5)**
**FASE 60: Dependency Management System**
