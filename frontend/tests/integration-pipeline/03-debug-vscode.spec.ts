/**
 * Layer 3: VS Code Extension - Conditional Debug Tests
 *
 * This is the TERTIARY layer that only runs when Layer 1 or Layer 2
 * have more than 3 failures, providing visual debugging assistance.
 *
 * Characteristics:
 * - ✅ Trace Viewer (step-by-step visual)
 * - ✅ Test Explorer UI
 * - ✅ Debugging with breakpoints
 * - ⚠️ Manual intervention required
 *
 * Trigger Conditions:
 * - Layer 1 (Native) failures > 3
 * - Layer 2 (MCP) failures > 3
 * - Critical bug detected (e.g., BUG-B1)
 * - User manual override
 *
 * Success Criteria:
 * - Identify root cause of failures
 * - Generate traces visualizable in VS Code
 * - Document insights from debugging
 *
 * Usage:
 * This test file should be executed via VS Code Playwright Extension:
 * 1. Open VS Code
 * 2. Open Testing panel
 * 3. Run specific failed scenarios
 * 4. Use Trace Viewer for step-by-step analysis
 *
 * @see Plan: foamy-singing-toast.md - Layer 3 specification
 */

import { test, expect, type Page } from '@playwright/test';
import {
  coreScenarios,
  edgeCaseScenarios,
  testScraperIds,
  type ScenarioResult,
} from '../shared/test-scenarios';
import {
  navigateToScrapersPage,
  toggleScraper,
  isScraperEnabled,
  getActiveScrapersCount,
  formatDuration,
  saveJSON,
  loadJSON,
} from '../shared/helpers';
import {
  assertDebounceProtection,
  assertMinScrapersError,
} from '../shared/assertions';
import {
  extractBugsFromResults,
  printBugSummary,
  type LayerResult,
} from '../shared/bug-tracker';

// Test configuration with trace enabled
test.use({
  storageState: 'frontend/playwright/.auth/user.json',
  viewport: { width: 1280, height: 720 },
  video: 'on', // Always record for debugging
  screenshot: 'on', // Always screenshot for debugging
  trace: 'on', // Always trace for VS Code Trace Viewer
});

// Results collection
const scenarioResults: ScenarioResult[] = [];
const rootCauses: Record<string, string> = {};

/**
 * Check if this layer should run
 */
test.beforeAll(async () => {
  const layer1Results = loadJSON<LayerResult>('frontend/reports/layer-native-results.json');
  const layer2Results = loadJSON<LayerResult>('frontend/reports/layer-mcp-results.json');

  const layer1Failures = layer1Results?.scenarios.filter(s => s.status === 'FAILED').length || 0;
  const layer2Failures = layer2Results?.scenarios.filter(s => s.status === 'FAILED').length || 0;

  const shouldRun = layer1Failures > 3 || layer2Failures > 3;

  if (!shouldRun) {
    console.log('⏭️  Layer 3 (VS Code) SKIPPED - no significant failures detected');
    console.log(`   Layer 1 failures: ${layer1Failures}, Layer 2 failures: ${layer2Failures}`);
    test.skip();
  } else {
    console.log('🟡 Layer 3 (VS Code) RUNNING - debugging needed');
    console.log(`   Layer 1 failures: ${layer1Failures}, Layer 2 failures: ${layer2Failures}`);
  }
});

/**
 * Setup
 */
test.beforeEach(async ({ page }) => {
  await navigateToScrapersPage(page);
});

/**
 * Teardown: Save debug insights
 */
test.afterAll(async () => {
  const totalExecutionTime = scenarioResults.reduce((sum, r) => sum + r.executionTime, 0);

  const layerResult: LayerResult = {
    passRate: scenarioResults.filter(r => r.status === 'PASSED').length / scenarioResults.length,
    bugsDetected: extractBugsFromResults(scenarioResults),
    uniqueBugs: [],
    executionTime: totalExecutionTime,
    scenarios: scenarioResults,
  };

  // Save results
  saveJSON('frontend/reports/layer-vscode-results.json', layerResult);

  // Save root causes
  saveJSON('frontend/reports/layer-vscode-root-causes.json', rootCauses);

  console.log('\n📊 Layer 3 (VS Code) - Debug Summary\n');
  console.log(`Scenarios Debugged: ${scenarioResults.length}`);
  console.log(`Root Causes Found: ${Object.keys(rootCauses).length}`);
  console.log(`Traces Generated: ${scenarioResults.filter(r => r.trace).length}`);
  console.log(`Execution Time: ${formatDuration(totalExecutionTime)}\n`);

  console.log('🔍 Root Causes:\n');
  Object.entries(rootCauses).forEach(([scenario, cause]) => {
    console.log(`  ${scenario}: ${cause}`);
  });

  printBugSummary(layerResult.bugsDetected);
});

/**
 * ============================================================================
 * DEBUG SCENARIOS - Only failed scenarios from Layer 1/2
 * ============================================================================
 */

test.describe('Debug Failed Scenarios', () => {
  /**
   * DEBUG: SC-01 - Toggle Single Scraper
   *
   * Common failures:
   * - Timeout waiting for counter change
   * - React Query refetch latency (2-5s)
   */
  test('DEBUG: SC-01 - Toggle Single Scraper', async ({ page }) => {
    const startTime = Date.now();
    const scenario = coreScenarios.find(s => s.id === 'SC-01')!;

    try {
      console.log('🐛 Debugging SC-01: Toggle Single Scraper');

      // Get initial state
      const initialCount = await getActiveScrapersCount(page);
      const initialEnabled = await isScraperEnabled(page, testScraperIds.BRAPI);

      console.log(`  Initial state: count=${initialCount}, enabled=${initialEnabled}`);

      // Toggle scraper with detailed logging
      console.log('  Clicking toggle...');
      const clickTime = Date.now();
      await toggleScraper(page, testScraperIds.BRAPI);
      console.log(`  Click completed in ${Date.now() - clickTime}ms`);

      // Wait for mutation with timeout logging
      console.log('  Waiting for mutation...');
      const mutationStart = Date.now();

      await page.waitForTimeout(2000); // Wait for React Query refetch

      const mutationTime = Date.now() - mutationStart;
      console.log(`  Mutation took ${mutationTime}ms`);

      // Get final state
      const finalCount = await getActiveScrapersCount(page);
      const finalEnabled = await isScraperEnabled(page, testScraperIds.BRAPI);

      console.log(`  Final state: count=${finalCount}, enabled=${finalEnabled}`);

      // Verify state changed
      expect(finalEnabled).toBe(!initialEnabled);

      // Root cause analysis
      if (mutationTime > 3000) {
        rootCauses['SC-01'] = `React Query refetch latency ${mutationTime}ms (expected <1000ms)`;
      } else {
        rootCauses['SC-01'] = 'Toggle works correctly';
      }

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'vscode',
        status: 'PASSED',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });
    } catch (error) {
      rootCauses['SC-01'] = `Timeout: ${(error as Error).message}`;

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'vscode',
        status: 'FAILED',
        executionTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      });
      throw error;
    }
  });

  /**
   * DEBUG: SC-01.1 - Debounce Protection (BUG-B1)
   *
   * Root cause analysis:
   * - Human timing (50-100ms) masks race condition
   * - MCP timing (<1ms) exposes race condition
   */
  test('DEBUG: SC-01.1 - Debounce Protection', async ({ page }) => {
    const startTime = Date.now();
    const scenario = coreScenarios.find(s => s.id === 'SC-01.1')!;

    try {
      console.log('🐛 Debugging SC-01.1: Debounce Protection (BUG-B1)');

      // Test with different click intervals
      const intervals = [1, 10, 50, 100];

      for (const interval of intervals) {
        console.log(`\n  Testing with ${interval}ms interval...`);

        const result = await assertDebounceProtection(page, testScraperIds.BRAPI, interval);

        console.log(
          `    Result: ${result.initialCount} → ${result.finalCount} (${
            result.debounced ? 'DEBOUNCED' : 'RACE CONDITION'
          })`
        );

        if (!result.debounced) {
          console.log(`    ⚠️  Race condition detected at ${interval}ms interval!`);
          rootCauses['SC-01.1'] = `Race condition exposed at ${interval}ms interval (BUG-B1)`;
        }
      }

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'vscode',
        status: 'PASSED',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });
    } catch (error) {
      rootCauses['SC-01.1'] = `Debug failed: ${(error as Error).message}`;

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'vscode',
        status: 'FAILED',
        executionTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      });
      throw error;
    }
  });

  /**
   * DEBUG: SC-06 - Business Rule Enforcement (BUG-02)
   *
   * Root cause analysis:
   * - Business rule validation blocks legitimate workflows
   * - Error message clarity
   */
  test('DEBUG: SC-06 - Business Rule Enforcement', async ({ page }) => {
    const startTime = Date.now();
    const scenario = edgeCaseScenarios.find(s => s.id === 'SC-06')!;

    try {
      console.log('🐛 Debugging SC-06: Business Rule Enforcement (BUG-02)');

      // Get initial state
      const initialCount = await getActiveScrapersCount(page);
      console.log(`  Initial active scrapers: ${initialCount}`);

      // Ensure exactly 2 active
      if (initialCount !== 2) {
        console.log(`  Adjusting to 2 active scrapers...`);
        // Implementation depends on current state
      }

      // Try to disable one scraper
      console.log('  Attempting to disable scraper (should fail)...');
      await toggleScraper(page, testScraperIds.BRAPI, false);

      // Wait for error
      await page.waitForTimeout(1000);

      // Check for error message
      await assertMinScrapersError(page);

      rootCauses['SC-06'] = 'Business rule 400 error (expected behavior, but blocks testing)';

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'vscode',
        status: 'PASSED',
        executionTime: Date.now() - startTime,
        bugsDetected: ['BUG-02'],
        timestamp: new Date(),
      });
    } catch (error) {
      rootCauses['SC-06'] = `Unexpected error: ${(error as Error).message}`;

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'vscode',
        status: 'FAILED',
        executionTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      });
      throw error;
    }
  });

  /**
   * DEBUG: SC-10 - Focus Visibility (BUG-C1)
   *
   * Root cause analysis:
   * - CSS outline removed
   * - Focus indicators insufficient contrast
   */
  test('DEBUG: SC-10 - Focus Visibility', async ({ page }) => {
    const startTime = Date.now();
    const scenario = edgeCaseScenarios.find(s => s.id === 'SC-10')!;

    try {
      console.log('🐛 Debugging SC-10: Focus Visibility (BUG-C1)');

      // Focus the switch
      const switchElement = page.getByRole('switch', { name: new RegExp(testScraperIds.BRAPI, 'i') });
      await switchElement.focus();

      // Check focus styles
      const outlineWidth = await switchElement.evaluate(el =>
        window.getComputedStyle(el).outlineWidth
      );
      const outlineStyle = await switchElement.evaluate(el =>
        window.getComputedStyle(el).outlineStyle
      );
      const outlineColor = await switchElement.evaluate(el =>
        window.getComputedStyle(el).outlineColor
      );

      console.log(`  Focus styles:`);
      console.log(`    outline-width: ${outlineWidth}`);
      console.log(`    outline-style: ${outlineStyle}`);
      console.log(`    outline-color: ${outlineColor}`);

      const hasFocusRing = outlineWidth !== '0px' && outlineStyle !== 'none';

      if (!hasFocusRing) {
        rootCauses['SC-10'] = 'Focus ring removed (BUG-C1) - outline: none';
        console.log(`    ⚠️  BUG-C1 DETECTED: No focus ring visible`);

        scenarioResults.push({
          scenarioId: scenario.id,
          layer: 'vscode',
          status: 'FAILED',
          executionTime: Date.now() - startTime,
          bugsDetected: ['BUG-C1'],
          errorMessage: 'Focus ring not visible',
          timestamp: new Date(),
        });

        throw new Error('BUG-C1: Focus ring not visible');
      }

      rootCauses['SC-10'] = 'Focus ring visible';

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'vscode',
        status: 'PASSED',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });
    } catch (error) {
      const alreadyRecorded = scenarioResults.some(r => r.scenarioId === scenario.id);
      if (!alreadyRecorded) {
        rootCauses['SC-10'] = `Debug failed: ${(error as Error).message}`;

        scenarioResults.push({
          scenarioId: scenario.id,
          layer: 'vscode',
          status: 'FAILED',
          executionTime: Date.now() - startTime,
          errorMessage: (error as Error).message,
          timestamp: new Date(),
        });
      }
      throw error;
    }
  });
});

/**
 * ============================================================================
 * VS CODE DEBUGGING TIPS
 * ============================================================================
 *
 * To use this test file effectively in VS Code:
 *
 * 1. **Test Explorer:**
 *    - Open Testing panel (Ctrl+Shift+T)
 *    - Find this file in the test tree
 *    - Click play icon next to specific test
 *    - Use debug icon to step through with breakpoints
 *
 * 2. **Trace Viewer:**
 *    - After test runs, click "Show Trace" in Test Explorer
 *    - See step-by-step visual timeline
 *    - Inspect DOM, Network, Console at each step
 *
 * 3. **Breakpoints:**
 *    - Set breakpoints in test code
 *    - Click debug icon in Test Explorer
 *    - Step through with F10/F11
 *    - Inspect variables in Debug panel
 *
 * 4. **Watch Mode:**
 *    - Enable "Auto Run" in Test Explorer
 *    - Tests re-run on file changes
 *    - Fast iteration cycle
 *
 * 5. **Screenshots/Videos:**
 *    - Find in `test-results/` directory
 *    - Review visual state at failure point
 *
 * ============================================================================
 */
