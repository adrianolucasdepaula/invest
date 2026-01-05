---
name: zero-tolerance
description: Executes Zero Tolerance validation (TypeScript + Build + Lint) for backend and frontend
---

# Zero Tolerance Validation Skill

Execute complete Zero Tolerance validation for the project:

## Backend Validation

```bash
cd backend
npx tsc --noEmit
npm run build
```

## Frontend Validation

```bash
cd frontend
npx tsc --noEmit
npm run build
npm run lint
```

## Success Criteria

- TypeScript: 0 errors (backend + frontend)
- Build: Successful (backend + frontend)
- Lint: 0 critical warnings (frontend)

Report results in table format:

| Check | Backend | Frontend |
|-------|---------|----------|
| TypeScript | ✅/❌ | ✅/❌ |
| Build | ✅/❌ | ✅/❌ |
| Lint | N/A | ✅/❌ |

If any check fails, list the errors and suggest fixes.
