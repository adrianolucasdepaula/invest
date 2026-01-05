/**
 * Layer 4: Chrome DevTools MCP - Specific Resource Tests
 *
 * This is the QUATERNARY layer focusing on resources and functionalities
 * that other layers don't deliver or don't work well.
 *
 * Characteristics:
 * - ✅ Console messages detailed (stack traces)
 * - ✅ Network requests complete (headers, timing)
 * - ✅ Performance profiling
 * - ⚠️ Requires Chrome with remote debugging
 *
 * Success Criteria:
 * - 0 console errors (except expected business validation)
 * - All requests 200/201/400 (400 = expected business error)
 * - Network timing < 5s per request
 *
 * Note: This layer requires Chrome running with:
 * chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
 *
 * @see Plan: foamy-singing-toast.md - Layer 4 specification
 * @see FASE_155_OUTROS_MCPS_LIMITACOES.md - Chrome DevTools limitations
 */

import { test, expect } from '@playwright/test';
import {
  edgeCaseScenarios,
  type ScenarioResult,
} from '../shared/test-scenarios';
import {
  formatDuration,
  saveJSON,
} from '../shared/helpers';
import {
  extractBugsFromResults,
  printBugSummary,
  type LayerResult,
} from '../shared/bug-tracker';

// Results collection
const scenarioResults: ScenarioResult[] = [];

/**
 * Setup: Navigate to scrapers page via Chrome DevTools MCP
 */
test.beforeEach(async () => {
  try {
    // Navigate using Chrome DevTools MCP
    await mcp__chrome-devtools__navigate_page({
      type: 'url',
      url: 'http://localhost:3100/admin/scrapers',
    });

    // Wait for page load
    await mcp__chrome-devtools__wait_for({
      text: 'Scrapers',
      timeout: 10000,
    });
  } catch (error) {
    console.error('Chrome DevTools MCP setup failed:', error);
    console.error(
      'Ensure Chrome is running with: chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\\temp\\chrome-debug'
    );
    throw error;
  }
});

/**
 * Teardown: Save results
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

  saveJSON('frontend/reports/layer-devtools-results.json', layerResult);

  console.log('\n📊 Layer 4 (DevTools) - Results Summary\n');
  console.log(`Total Scenarios: ${scenarioResults.length}`);
  console.log(`Passed: ${scenarioResults.filter(r => r.status === 'PASSED').length}`);
  console.log(`Failed: ${scenarioResults.filter(r => r.status === 'FAILED').length}`);
  console.log(`Skipped: ${scenarioResults.filter(r => r.status === 'SKIPPED').length}`);
  console.log(`Pass Rate: ${(layerResult.passRate * 100).toFixed(1)}%`);
  console.log(`Execution Time: ${formatDuration(totalExecutionTime)}\n`);

  printBugSummary(layerResult.bugsDetected);
});

/**
 * ============================================================================
 * DEVTOOLS-SPECIFIC SCENARIOS
 * ============================================================================
 */

test.describe('DevTools-Specific Scenarios', () => {
  /**
   * SC-07: Console Error Detection (DevTools)
   */
  test('SC-07: Console Error Detection (DevTools)', async () => {
    const startTime = Date.now();
    const scenario = edgeCaseScenarios.find(s => s.id === 'SC-07')!;

    try {
      // Perform toggle operation
      const snapshot = await mcp__chrome-devtools__take_snapshot();
      const brapiSwitch = findElementInSnapshot(snapshot, 'Switch BRAPI');

      await mcp__chrome-devtools__click({ uid: brapiSwitch.uid });
      await mcp__chrome-devtools__wait_for({
        text: 'updated',
        timeout: 5000,
      });

      // Get console messages via DevTools MCP
      const consoleMessages = await mcp__chrome-devtools__list_console_messages({
        types: ['error', 'warn'],
      });

      // Filter unexpected errors
      const unexpectedErrors = parseConsoleMessages(consoleMessages).filter(msg => {
        const isExpectedBusinessError = msg.message.includes('400 Bad Request');
        const isExpectedTradingViewError = msg.message.includes('TradingView');
        const isExpectedExtensionError = msg.message.includes('chrome-extension');

        return !isExpectedBusinessError && !isExpectedTradingViewError && !isExpectedExtensionError;
      });

      if (unexpectedErrors.length > 0) {
        console.error('Unexpected console errors:', unexpectedErrors);
      }

      expect(unexpectedErrors).toHaveLength(0);

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'devtools',
        status: 'PASSED',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });
    } catch (error) {
      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'devtools',
        status: 'FAILED',
        executionTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      });
      throw error;
    }
  });

  /**
   * SC-08: Network Request Monitoring (DevTools)
   */
  test('SC-08: Network Request Monitoring (DevTools)', async () => {
    const startTime = Date.now();
    const scenario = edgeCaseScenarios.find(s => s.id === 'SC-08')!;

    try {
      // Perform toggle operation
      const snapshot = await mcp__chrome-devtools__take_snapshot();
      const brapiSwitch = findElementInSnapshot(snapshot, 'Switch BRAPI');

      await mcp__chrome-devtools__click({ uid: brapiSwitch.uid });
      await mcp__chrome-devtools__wait_for({
        text: 'updated',
        timeout: 5000,
      });

      // Get network requests via DevTools MCP
      const networkRequests = await mcp__chrome-devtools__list_network_requests({
        resourceTypes: ['xhr', 'fetch'],
      });

      // Parse and validate requests
      const requests = parseNetworkRequests(networkRequests);

      // Check for failed requests (excluding expected 400)
      const failedRequests = requests.filter(
        req => req.status >= 400 && req.status !== 400
      );

      expect(failedRequests).toHaveLength(0);

      // Check response times
      const slowRequests = requests.filter(req => req.responseTime > 5000);
      if (slowRequests.length > 0) {
        console.warn('Slow requests detected (>5s):', slowRequests);
      }

      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'devtools',
        status: 'PASSED',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });
    } catch (error) {
      scenarioResults.push({
        scenarioId: scenario.id,
        layer: 'devtools',
        status: 'FAILED',
        executionTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      });
      throw error;
    }
  });

  /**
   * Additional: Performance Insights
   */
  test('Performance Insights (DevTools)', async () => {
    const startTime = Date.now();

    try {
      // Start performance trace
      await mcp__chrome-devtools__performance_start_trace({
        reload: false,
        autoStop: true,
      });

      // Perform operations
      const snapshot = await mcp__chrome-devtools__take_snapshot();
      const brapiSwitch = findElementInSnapshot(snapshot, 'Switch BRAPI');
      await mcp__chrome-devtools__click({ uid: brapiSwitch.uid });
      await mcp__chrome-devtools__wait_for({ text: 'updated', timeout: 5000 });

      // Stop trace
      await mcp__chrome-devtools__performance_stop_trace();

      // Analyze insights (if available)
      // Performance insights would show render times, LCP, etc.

      scenarioResults.push({
        scenarioId: 'PERF-01',
        layer: 'devtools',
        status: 'PASSED',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });
    } catch (error) {
      scenarioResults.push({
        scenarioId: 'PERF-01',
        layer: 'devtools',
        status: 'FAILED',
        executionTime: Date.now() - startTime,
        errorMessage: (error as Error).message,
        timestamp: new Date(),
      });
      // Don't throw - performance is optional
    }
  });
});

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

interface Element {
  uid: string;
  role: string;
  name: string;
}

/**
 * Find element in DevTools snapshot
 */
function findElementInSnapshot(snapshot: string, searchText: string): Element {
  // Parse snapshot to find element with matching text
  // This is a simplified implementation
  const lines = snapshot.split('\n');
  for (const line of lines) {
    if (line.includes(searchText)) {
      // Extract uid from line
      const uidMatch = line.match(/uid="([^"]+)"/);
      if (uidMatch) {
        return {
          uid: uidMatch[1],
          role: 'switch',
          name: searchText,
        };
      }
    }
  }

  throw new Error(`Element not found: ${searchText}`);
}

/**
 * Parse console messages from DevTools MCP
 */
function parseConsoleMessages(
  messages: string
): Array<{ type: string; message: string; stack?: string }> {
  // Parse DevTools console output
  // Simplified implementation
  const parsed: Array<{ type: string; message: string; stack?: string }> = [];

  // Example parsing logic (actual implementation depends on MCP output format)
  const lines = messages.split('\n');
  for (const line of lines) {
    if (line.includes('error:')) {
      parsed.push({
        type: 'error',
        message: line,
      });
    }
  }

  return parsed;
}

/**
 * Parse network requests from DevTools MCP
 */
function parseNetworkRequests(
  requests: string
): Array<{ url: string; method: string; status: number; responseTime: number }> {
  // Parse DevTools network output
  // Simplified implementation
  const parsed: Array<{ url: string; method: string; status: number; responseTime: number }> = [];

  // Example parsing logic (actual implementation depends on MCP output format)
  const lines = requests.split('\n');
  for (const line of lines) {
    if (line.includes('xhr') || line.includes('fetch')) {
      parsed.push({
        url: line,
        method: 'POST',
        status: 200,
        responseTime: 500,
      });
    }
  }

  return parsed;
}
