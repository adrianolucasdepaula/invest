---
name: mcp-quadruplo
description: Executes MCP Quadruplo validation (Playwright + Chrome DevTools + Accessibility + Documentation Research) for complex features and unknown bugs
---

# MCP Quadruplo Validation Skill

Execute comprehensive validation with **preventive documentation research**:

## 1. Playwright MCP

Navigate and capture page state:

```javascript
mcp__playwright__browser_navigate({ url: "TARGET_URL" })
mcp__playwright__browser_snapshot({})
mcp__playwright__browser_take_screenshot({ fullPage: true })
```

## 2. Chrome DevTools MCP

Check for errors and network issues:

```javascript
mcp__chrome-devtools__take_snapshot({})
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
mcp__chrome-devtools__list_network_requests({})
```

## 3. Accessibility MCP

Run WCAG audit:

```javascript
mcp__a11y__audit_webpage({ url: "TARGET_URL" })
mcp__a11y__get_summary({ url: "TARGET_URL" })
```

## 4. Documentation Research ⭐ NEW

### 4.1 GitHub Issues Search

```bash
WebSearch: "[library] [technology] [problem] site:github.com/issues 2024 OR 2025"
```

**Goal:** Find known issues and workarounds from community

### 4.2 Official Documentation

```bash
WebSearch: "[technology] official documentation [feature] 2025"
```

**Goal:** Verify feature is documented and not deprecated

### 4.3 Internal KNOWN-ISSUES.md

```bash
Grep: "keyword1|keyword2|keyword3" in KNOWN-ISSUES.md
```

**Goal:** Check if similar issue was already solved in project

### 4.4 Git History Analysis

```bash
git log --grep="keyword1|keyword2" --all --oneline -20
```

**Goal:** Find previous solutions or patterns in codebase

### 4.5 Parallel WebSearch (Best Practices)

```bash
WebSearch: "[technology] best practices 2025"
WebSearch: "[problem] solution site:stackoverflow.com OR github.com"
WebSearch: "[alt1] vs [alt2] comparison 2025"
```

**Goal:** Cross-validate solution with minimum 3 sources

## Validation Report Template

| Validation Step | Status | Details |
|----------------|--------|---------|
| **1. Playwright** | ✅/❌ | Page loaded, X elements found |
| **2. Chrome DevTools** | ✅/❌ | X console errors, Y network errors |
| **3. Accessibility** | ✅/❌ | X violations, Y warnings |
| **4. Documentation Research** | ✅/❌ | X sources found, Y precedents identified |

### Documentation Research Summary

| Source | Findings | Action Taken |
|--------|----------|--------------|
| GitHub Issues | List issues found | Applied workaround/solution |
| Official Docs | Feature status | Confirmed usage pattern |
| KNOWN-ISSUES.md | Similar issues | Reused previous solution |
| Git History | Related commits | Followed existing pattern |
| WebSearch | Community solutions | Validated with 3+ sources |

## Success Criteria

**MCP Triplo (Steps 1-3):**
- ✅ Page loads without JavaScript errors
- ✅ Console: 0 errors
- ✅ Network: No 4xx/5xx errors
- ✅ Accessibility: No critical violations

**Documentation Research (Step 4):**
- ✅ Minimum 2 GitHub issues reviewed
- ✅ Official docs consulted
- ✅ Internal history checked (KNOWN-ISSUES.md + git log)
- ✅ Solution validated by 3+ sources

## When to Use MCP Quadruplo vs Triplo

| Situation | Use | Reason |
|-----------|-----|--------|
| Complex new feature | **QUADRUPLO** | Prevent known bugs upfront |
| Unknown bug (>2h debug) | **QUADRUPLO** | Community may have solution |
| New library integration | **QUADRUPLO** | Check breaking changes |
| Simple UI validation | TRIPLO | No research needed |
| Existing feature change | TRIPLO | Architecture validated |

## ROI Example (Real Case - FASE 133)

**Without Documentation Research:**
- Trial-and-error: 12 hours
- 28 failed attempts
- Result: ❌ No solution

**With Documentation Research (8 hours):**
- Found GitHub Issues #68255 and #3700
- Found existing pattern (commit 45a8dd6)
- Result: ✅ Root cause + definitive solution

**If research done FIRST:** 2 hours total
**Time saved:** 19 hours (~90%)

## Output to User

Create detailed validation report in `docs/validacoes/VALIDACAO_FASE_XXX_MCP_QUADRUPLO.md`

Include:
1. Context of implementation
2. MCP Triplo results (steps 1-3)
3. **Documentation Research findings (step 4)** ⭐
4. Decisions based on research
5. Screenshots evidence
6. Final metrics

## References

- **Methodology:** `docs/MCP_QUADRUPLO_METODOLOGIA.md`
- **Template:** `docs/VALIDACAO_MCP_QUADRUPLO_TEMPLATE.md`
- **Real case study:** `BUG_CRITICO_DOCKER_NEXT_CACHE.md` (FASE 133)
- **Command:** `.claude/commands/mcp-quadruplo.md`
