# Git Hooks Documentation

**Location:** `.githooks/`  
**Setup:** Run `.\setup-hooks.ps1` (PowerShell) or `chmod +x .githooks/* && git config core.hooksPath .githooks` (Bash)

---

## 📋 Available Hooks

### 1. pre-commit

**Purpose:** Validate code quality BEFORE committing

**Checks:**

- ✅ TypeScript compilation (backend + frontend)
- ✅ ESLint (backend + frontend)
- ✅ Sensitive files detection (`.env`, `terraform.tfstate`)

**Run time:** ~10-15 seconds

**Example output:**

```
🔍 Pre-commit validation...
→ Validating TypeScript (Backend)...
✅ TypeScript OK (Backend)
→ Validating TypeScript (Frontend)...
✅ TypeScript OK (Frontend)
→ Running ESLint (Backend)...
✅ ESLint OK (Backend)
→ Running ESLint (Frontend)...
✅ ESLint OK (Frontend)
→ Checking for sensitive files...
✅ No sensitive files detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All pre-commit checks passed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Common errors:**

```
❌ TypeScript errors in backend!
   → Fix errors reported by `tsc --noEmit`

❌ ESLint errors in frontend!
   → Fix errors reported by `npm run lint`

❌ CRITICAL: Attempting to commit .env file!
   → Run `git restore --staged .env`
```

---

### 2. pre-push

**Purpose:** Validate build BEFORE pushing to remote

**Checks:**

- ✅ Backend build (`npm run build`)
- ✅ Frontend build (`npm run build`)
- ⚠️ Backend tests (optional, doesn't block)

**Run time:** ~30-60 seconds

**Example output:**

```
🚀 Pre-push validation...
→ Building Backend...
✅ Backend build OK
→ Building Frontend...
✅ Frontend build OK
→ Running Backend Tests...
✅ Backend tests passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All pre-push checks passed!
   Safe to push to remote.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Common errors:**

```
❌ Backend build failed!
   → Check build logs in `backend/dist/`

❌ Frontend build failed!
   → Check build logs in `frontend/.next/`
```

---

### 3. commit-msg

**Purpose:** Validate commit message format (Conventional Commits)

**Format:** `type(scope): description`

**Valid types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting)
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance
- `perf` - Performance
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert previous commit

**Example valid messages:**

```
✅ feat(assets): add ticker history merge
✅ fix(portfolio): calculate correct gain of day
✅ docs(readme): update installation steps
✅ chore(deps): update dependencies
```

**Example invalid messages:**

```
❌ "updated files"
❌ "WIP"
❌ "Fixed bug"  (should be "fix(scope): description")
```

**Error output:**

```
❌ Invalid commit message format!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conventional Commits format required:
  type(scope): description

Your commit message:
  updated files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Setup

### First Time Setup

```powershell
# PowerShell (Windows)
.\setup-hooks.ps1
```

```bash
# Bash (Linux/macOS)
chmod +x .githooks/*
git config core.hooksPath .githooks
```

### Verify Setup

```bash
git config core.hooksPath
# Output: .githooks
```

---

## 🚫 Temporary Disable

If you need to bypass hooks temporarily (NOT recommended):

```bash
# Skip pre-commit + commit-msg
git commit --no-verify -m "message"

# Skip pre-push
git push --no-verify
```

**⚠️ WARNING:** Only use `--no-verify` in emergency situations. Pushing broken code to remote affects the entire team.

---

## 🐛 Troubleshooting

### Hook not running

**Problem:** Commit/push succeeds without validation

**Solution:**

```bash
# Check hooks path
git config core.hooksPath

# Re-run setup
.\setup-hooks.ps1
```

### Permission denied (Linux/macOS)

**Problem:** `permission denied: .githooks/pre-commit`

**Solution:**

```bash
chmod +x .githooks/*
```

### Git Bash not found (Windows)

**Problem:** Hooks don't run on Windows

**Solution:**

- Install Git for Windows: https://git-scm.com/download/win
- Git Bash is bundled automatically
- Hooks will run via Git Bash (transparent to user)

### Slow hook execution

**Problem:** Pre-push takes > 2 minutes

**Solution:**

- Check `npm run build` performance
- Consider caching `node_modules/` in Docker
- Skip tests temporarily: edit `.githooks/pre-push` to remove test step

---

## 📊 Performance

| Hook           | Average Time | What It Does                        |
| -------------- | ------------ | ----------------------------------- |
| **pre-commit** | ~15 seconds  | TypeScript + ESLint (both projects) |
| **pre-push**   | ~60 seconds  | Build backend + frontend            |
| **commit-msg** | < 1 second   | Regex validation                    |

**Total overhead per commit+push:** ~75 seconds

**Benefits:**

- ✅ Catch errors before CI/CD
- ✅ Prevent pushing broken code
- ✅ Enforce code quality standards
- ✅ Save time (vs fixing in CI/CD)

---

## 🔄 Updating Hooks

If hooks are updated (e.g., new validations added):

```bash
# Pull latest changes
git pull

# Hooks update automatically (git config core.hooksPath persists)
# No action needed!
```

---

## 🎓 Best Practices

1. **Never disable hooks permanently**

   - Temporary `--no-verify` is OK in emergencies
   - Update hook logic instead of disabling

2. **Keep hooks fast** (< 2 minutes total)

   - Users will disable if too slow
   - Cache dependencies when possible

3. **Fail fast**

   - Stop at first error (don't run all checks)
   - Clear error messages

4. **Test hooks locally**

   - Before pushing hook changes
   - Verify on Windows + Linux/macOS

5. **Document all validations**
   - Update this README when adding checks
   - Include examples of errors/fixes

---

**Created:** 2025-11-24  
**Maintained by:** Claude Code (Sonnet 4.5)  
**Refs:** Sprint 3 - Memory Automation
