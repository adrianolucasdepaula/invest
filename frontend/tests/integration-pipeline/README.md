# Multi-Layer Testing Pipeline

Comprehensive 6-layer testing architecture for robust bug detection across all aspects of the application.

## Architecture Overview

```
Layer 1: Playwright Native (PRIMARY)
   ↓ baseline reference
Layer 2: Playwright MCP (SECONDARY)
   ↓ validation + race condition detection
Layer 3: VS Code Extension (TERTIARY - conditional)
   ↓ visual debugging
Layer 4: Chrome DevTools MCP (QUATERNARY)
   ↓ console/network specific
Layer 5: a11y MCP (PARALLEL)
   ↓ WCAG compliance
Layer 6: React Context MCP (PARALLEL)
   ↓ component inspection
```

## Quick Start

### Run Full Pipeline (Development)

```bash
cd frontend
npm run test:pipeline
# or
npm run test:pipeline:dev
```

### Run CI Pipeline (Fast)

```bash
npm run test:pipeline:ci
```

### Run Debug Pipeline

```bash
npm run test:pipeline:debug
```

## Layer Details

### Layer 1: Playwright Native (Baseline)

**Purpose:** Primary testing layer, serves as baseline reference

**File:** `01-baseline-native.spec.ts`

**Characteristics:**
- ✅ Fastest execution (~52s)
- ✅ Screenshots, videos, traces
- ✅ HTML reporter
- ⚠️ May miss race conditions (human-like timing 50-100ms)

**Run:**
```bash
npx playwright test 01-baseline-native.spec.ts
```

**Success Criteria:**
- Minimum 60% pass rate (8/14 scenarios)
- 0 console errors (except expected business validation)

---

### Layer 2: Playwright MCP (Validation)

**Purpose:** Validate Layer 1 results + detect race conditions

**File:** `02-validation-mcp.spec.ts`

**Characteristics:**
- ✅ Timing <1ms (detects race conditions)
- ✅ Snapshots incremental
- ✅ Console + Network integrated
- ⚠️ Setup time (4 restarts initially)

**Run:**
```bash
npx playwright test 02-validation-mcp.spec.ts
```

**Success Criteria:**
- Detect BUG-B1 (race condition debounce) ✅ CRITICAL
- Validate bugs from Layer 1 are reproducible

**Unique Bugs Detected:**
- **BUG-B1** (CRITICAL): Race condition in toggle debounce

---

### Layer 3: VS Code Extension (Conditional Debug)

**Purpose:** Visual debugging for persistent failures

**File:** `03-debug-vscode.spec.ts`

**Characteristics:**
- ✅ Trace Viewer (step-by-step visual)
- ✅ Test Explorer UI
- ✅ Debugging with breakpoints
- ⚠️ Manual intervention required

**Trigger Conditions:**
```typescript
shouldRun = (
  layer1Failures > 3 ||
  layer2Failures > 3 ||
  criticalBugDetected ||
  userRequestedDebug
);
```

**Run:**
```bash
# Via VS Code:
# 1. Open Testing panel (Ctrl+Shift+T)
# 2. Find test in tree
# 3. Click debug icon
# 4. Use Trace Viewer for step-by-step analysis

# Via CLI:
npx playwright test 03-debug-vscode.spec.ts
```

**Success Criteria:**
- Identify root cause of failures
- Generate traces visualizable in VS Code

---

### Layer 4: Chrome DevTools MCP (Console/Network)

**Purpose:** Specific resources (console, network, performance)

**File:** `04-devtools-mcp.spec.ts`

**Characteristics:**
- ✅ Console messages detailed (stack traces)
- ✅ Network requests complete (headers, timing)
- ✅ Performance profiling
- ⚠️ Requires Chrome with remote debugging

**Setup:**
```powershell
# Windows:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug

# macOS:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Linux:
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

**Run:**
```bash
npx playwright test 04-devtools-mcp.spec.ts
```

**Success Criteria:**
- 0 console errors (except expected business validation)
- All requests 200/201/400
- Network timing < 5s per request

---

### Layer 5: a11y MCP (WCAG Compliance)

**Purpose:** WCAG 2.1 AA accessibility testing

**File:** `05-accessibility-a11y.spec.ts`

**Characteristics:**
- ✅ Axe-core violations automatic
- ✅ Color contrast validation
- ✅ Semantic HTML structure
- ⚠️ Blocked by OAuth (workaround via HTML extraction)

**Run:**
```bash
npx playwright test 05-accessibility-a11y.spec.ts
```

**Success Criteria:**
- 0 SERIOUS violations
- 0 MODERATE violations
- Color contrast ≥ 4.5:1 (WCAG AA)

**Unique Bugs Detected:**
- **BUG-E1** (SERIOUS): Color contrast below WCAG AA
- **BUG-E2** (MEDIUM): Missing ARIA labels
- **BUG-E3** (MEDIUM): Form validation not announced
- **BUG-E4** (MEDIUM): Semantic HTML structure issues

---

### Layer 6: React Context MCP (Component Inspection)

**Purpose:** Component state/props validation

**File:** `06-components-react.spec.ts`

**Characteristics:**
- ✅ Component tree visualization
- ✅ Props/state inspection
- ✅ Source location tracking
- ⚠️ Blocked by OAuth (workaround via Playwright navigation)

**Run:**
```bash
npx playwright test 06-components-react.spec.ts
```

**Success Criteria:**
- ScraperCard has `isLocked` state (fix BUG-B1)
- Switch has `disabled={isPending || isLocked}`
- Source location correct: `ScraperCard.tsx:103-107`

---

## Test Scenarios (14 Total)

### Core Scenarios (6)
1. **SC-01:** Toggle Single Scraper
2. **SC-01.1:** Debounce Protection (CRITICAL - BUG-B1)
3. **SC-02:** Advanced Parameters Persistence
4. **SC-02.1:** Parameter Validation
5. **SC-03:** Apply Profile
6. **SC-03.1:** Profile Idempotency

### Edge Case Scenarios (5)
7. **SC-04:** Concurrent Toggle Operations
8. **SC-05:** Invalid Input Handling
9. **SC-06:** Business Rule Enforcement (min 2 scrapers - BUG-02)
10. **SC-07:** Console Error Detection
11. **SC-08:** Network Request Monitoring

### Accessibility Scenarios (3)
12. **SC-09:** Keyboard Navigation
13. **SC-10:** Focus Visibility (BUG-C1)
14. **SC-11:** WCAG 2.1 AA Compliance (BUG-E1-E4)

---

## Bug Detection Matrix

| Bug | Severity | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Layer 5 | Layer 6 |
|-----|----------|---------|---------|---------|---------|---------|---------|
| **BUG-B1** | CRITICAL | ❌ | ✅ | Debug | - | - | Validate |
| **BUG-02** | MEDIUM | ✅ | ✅ | Debug | - | - | - |
| **BUG-03** | MEDIUM | ✅ | ⚠️ | - | - | - | - |
| **BUG-C1** | MEDIUM | ⚠️ | - | ✅ | - | - | - |
| **BUG-E1** | SERIOUS | ❌ | ❌ | - | - | ✅ | - |
| **BUG-E2** | MEDIUM | ❌ | ❌ | - | - | ✅ | - |
| **BUG-E3** | MEDIUM | ❌ | ❌ | - | - | ✅ | - |
| **BUG-E4** | MEDIUM | ❌ | ❌ | - | - | ✅ | - |

**Legend:**
- ✅ Detects bug
- ❌ Misses bug
- ⚠️ May detect depending on conditions
- Debug: Used for debugging bug
- Validate: Validates if bug is fixed

---

## Pipeline Orchestration

### Configuration Presets

**Development (Full):**
```json
{
  "runNative": true,
  "runMCP": true,
  "runVSCode": true,
  "runDevTools": true,
  "runA11y": true,
  "runReactContext": true,
  "stopOnFailure": false,
  "parallelExecution": true
}
```

**CI/CD (Fast):**
```json
{
  "runNative": true,
  "runMCP": true,
  "runVSCode": false,
  "runDevTools": false,
  "runA11y": true,
  "runReactContext": false,
  "stopOnFailure": true,
  "parallelExecution": true
}
```

**Debug (Focus):**
```json
{
  "runNative": true,
  "runMCP": false,
  "runVSCode": true,
  "runDevTools": true,
  "runA11y": false,
  "runReactContext": false,
  "stopOnFailure": false,
  "parallelExecution": false
}
```

---

## Reports

After pipeline execution, reports are generated in `frontend/reports/`:

- **`pipeline-summary.json`** - Overall summary with all layers
- **`layer-native-results.json`** - Layer 1 detailed results
- **`layer-mcp-results.json`** - Layer 2 detailed results
- **`layer-vscode-results.json`** - Layer 3 debug insights
- **`layer-devtools-results.json`** - Layer 4 console/network
- **`layer-a11y-results.json`** - Layer 5 WCAG violations
- **`layer-react-context-results.json`** - Layer 6 component state
- **`bug-comparison.json`** - Cross-layer bug detection matrix
- **`layer-comparison.json`** - Layer-by-layer comparison

---

## Troubleshooting

### Layer 2 (MCP) - Setup Issues

**Problem:** MCP requires 4 browser restarts initially

**Solution:** This is normal. Playwright MCP initializes browser context on first use.

### Layer 4 (DevTools) - Chrome Not Running

**Error:** `Could not connect to Chrome`

**Solution:**
```powershell
# Start Chrome with remote debugging
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

### Layer 5 (a11y) - OAuth Blocker

**Problem:** a11y MCP can't navigate to authenticated pages

**Solution:** Pipeline uses workaround:
1. Playwright MCP navigates (authenticated)
2. Extract HTML from snapshot
3. Test HTML via `mcp__a11y__test_html_string`

### Layer 6 (React Context) - OAuth Blocker

**Problem:** React Context MCP can't navigate to authenticated pages

**Solution:** Same workaround as Layer 5 - Playwright MCP navigates first.

---

## Integration with Claude Code

### Slash Commands

```bash
/test-pipeline development  # Run full pipeline
/test-pipeline ci           # Run CI pipeline
/test-pipeline debug        # Run debug pipeline
```

### MCP Quadruplo Pattern

For comprehensive validation, use all 4 MCPs together:

```typescript
// 1. Navigate (Playwright MCP)
await mcp__playwright__browser_navigate({ url });

// 2. Extract HTML
const snapshot = await mcp__playwright__browser_snapshot();
const html = extractHTML(snapshot);

// 3. Parallel validation
const [a11y, console, components] = await Promise.all([
  mcp__a11y__test_html_string({ html }),
  mcp__playwright__browser_console_messages(),
  mcp__react-context__get_component_map(),
]);
```

---

## Best Practices

1. **Always run Layer 1 first** - Establishes baseline
2. **Compare Layer 2 with Layer 1** - Identify unique bugs
3. **Use Layer 3 only for failures** - Saves time
4. **Run Layers 4-6 in parallel** - Faster execution
5. **Review pipeline summary** - Comprehensive bug overview
6. **Fix CRITICAL bugs first** - BUG-B1 (race condition)
7. **Fix SERIOUS bugs second** - BUG-E1 (color contrast)
8. **Document findings** - Update ROADMAP.md

---

## Contributing

When adding new scenarios:

1. Add to `shared/test-scenarios.ts`
2. Implement in all relevant layers
3. Update bug tracking in `shared/bug-tracker.ts`
4. Document in this README
5. Test full pipeline end-to-end

---

**Last Updated:** 2026-01-04
**Version:** 1.0
**Author:** Claude Code
**Status:** Production Ready
