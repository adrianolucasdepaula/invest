/**
 * Flaky Test Detection & Quarantine System
 *
 * Implements systematic flaky test detection with ML-based scoring,
 * automatic quarantine, and re-integration mechanisms.
 *
 * Based on Atlassian Flakinator patterns (22,000 builds recovered, 7,000 flaky tests identified)
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @license FREE (Apache 2.0 compatible)
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Test run result
 */
export interface TestRunResult {
  testId: string;
  testFile: string;
  testName: string;
  passed: boolean;
  duration: number;
  timestamp: Date;
  error?: string;
  retryCount?: number;
  layer?: string;
}

/**
 * Flaky test record
 */
export interface FlakyTest {
  testId: string;
  testFile: string;
  testName: string;
  /** Historical run results */
  runHistory: TestRunResult[];
  /** Calculated flakiness score (0-1) */
  flakinessScore: number;
  /** Whether test is currently quarantined */
  quarantined: boolean;
  /** When quarantine started */
  quarantinedAt?: Date;
  /** Consecutive successes since quarantine */
  consecutiveSuccesses: number;
  /** Consecutive failures */
  consecutiveFailures: number;
  /** LLM-suggested fix (if available) */
  suggestedFix?: string;
  /** Detected flakiness patterns */
  detectedPatterns: FlakinessPattern[];
  /** First detected date */
  firstDetected: Date;
  /** Last run date */
  lastRun: Date;
  /** Total runs tracked */
  totalRuns: number;
  /** Total failures */
  totalFailures: number;
  /** Average duration (ms) */
  avgDuration: number;
  /** Duration variance */
  durationVariance: number;
}

/**
 * Flakiness patterns that can be detected
 */
export type FlakinessPattern =
  | 'timing-sensitive'      // Fails due to timing issues
  | 'network-dependent'     // Fails on network issues
  | 'state-pollution'       // Fails due to shared state
  | 'race-condition'        // Concurrent operation issues
  | 'resource-exhaustion'   // Memory/CPU issues
  | 'external-dependency'   // Third-party service issues
  | 'browser-specific'      // Fails on specific browser
  | 'data-dependent'        // Fails on specific data
  | 'order-dependent'       // Depends on test execution order
  | 'environment-specific'  // CI vs local differences
  | 'unknown';              // Pattern not detected

/**
 * Quarantine configuration
 */
export interface QuarantineConfig {
  /** Flakiness threshold to trigger quarantine (0-1) */
  flakinessThreshold: number;
  /** Consecutive successes needed to exit quarantine */
  reintegrationSuccesses: number;
  /** Maximum days in quarantine before forced review */
  maxQuarantineDays: number;
  /** Run quarantined tests in separate pipeline */
  runInSeparatePipeline: boolean;
  /** Minimum runs before calculating flakiness */
  minRunsForAnalysis: number;
  /** Historical runs to keep */
  historyLimit: number;
  /** Enable verbose logging */
  verbose: boolean;
  /** Report file path */
  reportPath: string;
}

/**
 * Default quarantine configuration
 */
export const defaultQuarantineConfig: QuarantineConfig = {
  flakinessThreshold: 0.1,        // 10% failure rate triggers quarantine
  reintegrationSuccesses: 5,      // 5 consecutive passes to exit
  maxQuarantineDays: 30,          // Force review after 30 days
  runInSeparatePipeline: true,    // Isolate quarantined tests
  minRunsForAnalysis: 5,          // Need 5+ runs for analysis
  historyLimit: 100,              // Keep last 100 runs
  verbose: false,
  reportPath: 'frontend/reports/flaky-tests-report.json',
};

/**
 * Flaky test report
 */
export interface FlakyTestReport {
  generatedAt: string;
  config: QuarantineConfig;
  summary: {
    totalTracked: number;
    quarantined: number;
    highFlakiness: number;      // > 0.3
    mediumFlakiness: number;    // 0.1 - 0.3
    lowFlakiness: number;       // < 0.1
    pendingReview: number;      // In quarantine > maxQuarantineDays
  };
  patterns: Record<FlakinessPattern, number>;
  tests: FlakyTest[];
  recentlyQuarantined: FlakyTest[];
  readyForReintegration: FlakyTest[];
}

/**
 * In-memory flaky tests store
 */
const flakyTestsStore: Map<string, FlakyTest> = new Map();

/**
 * Configuration
 */
let currentConfig: QuarantineConfig = { ...defaultQuarantineConfig };

/**
 * Calculate flakiness score using ML-inspired algorithm
 *
 * Factors considered:
 * - Failure rate (primary factor)
 * - Duration variance (timing sensitivity indicator)
 * - Recent trend (weighted towards recent runs)
 * - Pattern detection boost
 */
export function calculateFlakinessScore(test: FlakyTest): number {
  const { runHistory, detectedPatterns } = test;

  if (runHistory.length < currentConfig.minRunsForAnalysis) {
    return 0; // Not enough data
  }

  // 1. Basic failure rate (40% weight)
  const failureRate = test.totalFailures / test.totalRuns;

  // 2. Recent trend analysis (30% weight)
  // Weight recent runs more heavily
  const recentRuns = runHistory.slice(-20);
  let recentScore = 0;
  recentRuns.forEach((run, index) => {
    const weight = (index + 1) / recentRuns.length; // More recent = higher weight
    if (!run.passed) {
      recentScore += weight;
    }
  });
  const recentFailureRate = recentScore / recentRuns.reduce((sum, _, i) => sum + (i + 1) / recentRuns.length, 0);

  // 3. Duration variance factor (15% weight)
  // High variance suggests timing sensitivity
  const normalizedVariance = Math.min(test.durationVariance / (test.avgDuration * test.avgDuration + 1), 1);
  const varianceFactor = normalizedVariance * 0.5; // Cap contribution

  // 4. Pattern detection boost (15% weight)
  const patternBoost = detectedPatterns.length > 0 && !detectedPatterns.includes('unknown')
    ? 0.1 * Math.min(detectedPatterns.length, 3)
    : 0;

  // Calculate weighted score
  const score =
    failureRate * 0.4 +
    recentFailureRate * 0.3 +
    varianceFactor * 0.15 +
    patternBoost * 0.15;

  return Math.min(Math.max(score, 0), 1); // Clamp to 0-1
}

/**
 * Detect flakiness patterns from test history
 */
export function detectPatterns(test: FlakyTest): FlakinessPattern[] {
  const patterns: FlakinessPattern[] = [];
  const { runHistory } = test;

  const failures = runHistory.filter(r => !r.passed);
  if (failures.length === 0) return [];

  // Analyze error messages
  const errorMessages = failures
    .filter(f => f.error)
    .map(f => f.error!.toLowerCase());

  // Timing patterns
  if (
    errorMessages.some(e =>
      e.includes('timeout') ||
      e.includes('timed out') ||
      e.includes('waiting') ||
      e.includes('waitfor')
    )
  ) {
    patterns.push('timing-sensitive');
  }

  // Network patterns
  if (
    errorMessages.some(e =>
      e.includes('network') ||
      e.includes('fetch') ||
      e.includes('econnrefused') ||
      e.includes('socket') ||
      e.includes('xhr')
    )
  ) {
    patterns.push('network-dependent');
  }

  // State pollution patterns
  if (
    errorMessages.some(e =>
      e.includes('already exists') ||
      e.includes('duplicate') ||
      e.includes('not found') ||
      e.includes('undefined')
    )
  ) {
    patterns.push('state-pollution');
  }

  // Race condition patterns
  if (
    errorMessages.some(e =>
      e.includes('race') ||
      e.includes('concurrent') ||
      e.includes('locked') ||
      e.includes('busy')
    )
  ) {
    patterns.push('race-condition');
  }

  // Resource exhaustion patterns
  if (
    errorMessages.some(e =>
      e.includes('memory') ||
      e.includes('heap') ||
      e.includes('out of') ||
      e.includes('oom')
    )
  ) {
    patterns.push('resource-exhaustion');
  }

  // External dependency patterns
  if (
    errorMessages.some(e =>
      e.includes('api') ||
      e.includes('service') ||
      e.includes('unavailable') ||
      e.includes('503') ||
      e.includes('502')
    )
  ) {
    patterns.push('external-dependency');
  }

  // Duration variance analysis
  if (test.durationVariance > test.avgDuration * 2) {
    if (!patterns.includes('timing-sensitive')) {
      patterns.push('timing-sensitive');
    }
  }

  // Retry pattern (tests that pass on retry)
  const retriedTests = runHistory.filter(r => (r.retryCount || 0) > 0);
  if (retriedTests.length > runHistory.length * 0.3) {
    if (!patterns.includes('race-condition')) {
      patterns.push('race-condition');
    }
  }

  // If no patterns detected, mark as unknown
  if (patterns.length === 0) {
    patterns.push('unknown');
  }

  return patterns;
}

/**
 * Generate LLM fix suggestion based on patterns
 *
 * Returns human-readable suggestion (actual LLM integration would be here)
 */
export function generateFixSuggestion(test: FlakyTest): string {
  const suggestions: string[] = [];

  for (const pattern of test.detectedPatterns) {
    switch (pattern) {
      case 'timing-sensitive':
        suggestions.push(
          '- Add explicit waits (waitFor, waitForSelector) instead of fixed timeouts',
          '- Use Playwright auto-waiting features',
          '- Increase timeout values for slow operations'
        );
        break;
      case 'network-dependent':
        suggestions.push(
          '- Mock network requests with Playwright route.fulfill()',
          '- Add retry logic for network operations',
          '- Check for stable network conditions before test'
        );
        break;
      case 'state-pollution':
        suggestions.push(
          '- Ensure proper test isolation (beforeEach cleanup)',
          '- Use unique test data per run',
          '- Reset database/state before each test'
        );
        break;
      case 'race-condition':
        suggestions.push(
          '- Add proper synchronization points',
          '- Use Playwright locator.waitFor() before interactions',
          '- Avoid parallel operations on shared resources'
        );
        break;
      case 'resource-exhaustion':
        suggestions.push(
          '- Close browser contexts properly (afterEach)',
          '- Reduce test parallelism',
          '- Check for memory leaks in test setup'
        );
        break;
      case 'external-dependency':
        suggestions.push(
          '- Mock external services',
          '- Add health checks before tests',
          '- Implement graceful degradation in tests'
        );
        break;
      case 'browser-specific':
        suggestions.push(
          '- Use cross-browser compatible selectors',
          '- Check for browser-specific CSS/JS behavior',
          '- Run tests across multiple browsers'
        );
        break;
      case 'data-dependent':
        suggestions.push(
          '- Use synthetic/generated test data',
          '- Ensure test data consistency',
          '- Add data validation before assertions'
        );
        break;
      case 'order-dependent':
        suggestions.push(
          '- Make tests fully independent',
          '- Do not rely on other test outputs',
          '- Use proper setup/teardown hooks'
        );
        break;
      case 'environment-specific':
        suggestions.push(
          '- Normalize environment variables',
          '- Use consistent Docker containers',
          '- Check for CI vs local differences'
        );
        break;
      default:
        suggestions.push(
          '- Review test implementation for common flakiness causes',
          '- Add more detailed logging to identify root cause',
          '- Consider test refactoring'
        );
    }
  }

  return `Suggested fixes for "${test.testName}":\n\n${[...new Set(suggestions)].join('\n')}`;
}

/**
 * Record test run result
 */
export function recordTestRun(result: TestRunResult): void {
  const { testId, testFile, testName } = result;

  let test = flakyTestsStore.get(testId);

  if (!test) {
    // New test
    test = {
      testId,
      testFile,
      testName,
      runHistory: [],
      flakinessScore: 0,
      quarantined: false,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      detectedPatterns: [],
      firstDetected: new Date(),
      lastRun: new Date(),
      totalRuns: 0,
      totalFailures: 0,
      avgDuration: 0,
      durationVariance: 0,
    };
    flakyTestsStore.set(testId, test);
  }

  // Add to history
  test.runHistory.push(result);

  // Trim history if needed
  if (test.runHistory.length > currentConfig.historyLimit) {
    test.runHistory = test.runHistory.slice(-currentConfig.historyLimit);
  }

  // Update statistics
  test.lastRun = new Date();
  test.totalRuns++;
  if (!result.passed) {
    test.totalFailures++;
    test.consecutiveFailures++;
    test.consecutiveSuccesses = 0;
  } else {
    test.consecutiveSuccesses++;
    test.consecutiveFailures = 0;
  }

  // Update duration statistics
  const durations = test.runHistory.map(r => r.duration);
  test.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const squaredDiffs = durations.map(d => Math.pow(d - test.avgDuration, 2));
  test.durationVariance = squaredDiffs.reduce((a, b) => a + b, 0) / durations.length;

  // Detect patterns
  test.detectedPatterns = detectPatterns(test);

  // Calculate flakiness score
  test.flakinessScore = calculateFlakinessScore(test);

  // Generate fix suggestion if flaky
  if (test.flakinessScore >= currentConfig.flakinessThreshold) {
    test.suggestedFix = generateFixSuggestion(test);
  }

  // Check quarantine status
  updateQuarantineStatus(test);

  if (currentConfig.verbose) {
    console.log(
      `[FlakyTracker] ${testId}: score=${test.flakinessScore.toFixed(3)}, ` +
      `quarantined=${test.quarantined}, patterns=${test.detectedPatterns.join(',')}`
    );
  }
}

/**
 * Update quarantine status based on flakiness score
 */
function updateQuarantineStatus(test: FlakyTest): void {
  // Check for quarantine entry
  if (!test.quarantined && test.flakinessScore >= currentConfig.flakinessThreshold) {
    if (test.totalRuns >= currentConfig.minRunsForAnalysis) {
      test.quarantined = true;
      test.quarantinedAt = new Date();
      console.log(`[FlakyTracker] QUARANTINED: ${test.testId} (score: ${test.flakinessScore.toFixed(3)})`);
    }
  }

  // Check for reintegration
  if (test.quarantined && test.consecutiveSuccesses >= currentConfig.reintegrationSuccesses) {
    test.quarantined = false;
    test.quarantinedAt = undefined;
    test.consecutiveSuccesses = 0;
    console.log(`[FlakyTracker] REINTEGRATED: ${test.testId} after ${currentConfig.reintegrationSuccesses} consecutive successes`);
  }
}

/**
 * Get quarantined tests
 */
export function getQuarantinedTests(): FlakyTest[] {
  return Array.from(flakyTestsStore.values()).filter(t => t.quarantined);
}

/**
 * Get tests ready for reintegration (high consecutive successes)
 */
export function getTestsReadyForReintegration(): FlakyTest[] {
  return Array.from(flakyTestsStore.values()).filter(
    t => t.quarantined && t.consecutiveSuccesses >= currentConfig.reintegrationSuccesses - 1
  );
}

/**
 * Get tests pending review (quarantined too long)
 */
export function getTestsPendingReview(): FlakyTest[] {
  const maxQuarantineMs = currentConfig.maxQuarantineDays * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();

  return Array.from(flakyTestsStore.values()).filter(t => {
    if (!t.quarantined || !t.quarantinedAt) return false;
    return now - t.quarantinedAt.getTime() > maxQuarantineMs;
  });
}

/**
 * Get all tracked tests
 */
export function getAllTrackedTests(): FlakyTest[] {
  return Array.from(flakyTestsStore.values());
}

/**
 * Get flaky test by ID
 */
export function getTestById(testId: string): FlakyTest | undefined {
  return flakyTestsStore.get(testId);
}

/**
 * Check if test should be skipped (quarantined)
 */
export function shouldSkipTest(testId: string): boolean {
  const test = flakyTestsStore.get(testId);
  return test?.quarantined === true && currentConfig.runInSeparatePipeline;
}

/**
 * Generate flaky test report
 */
export function generateFlakyReport(): FlakyTestReport {
  const tests = getAllTrackedTests();

  // Count patterns
  const patternCounts: Record<FlakinessPattern, number> = {
    'timing-sensitive': 0,
    'network-dependent': 0,
    'state-pollution': 0,
    'race-condition': 0,
    'resource-exhaustion': 0,
    'external-dependency': 0,
    'browser-specific': 0,
    'data-dependent': 0,
    'order-dependent': 0,
    'environment-specific': 0,
    'unknown': 0,
  };

  tests.forEach(t => {
    t.detectedPatterns.forEach(p => {
      patternCounts[p]++;
    });
  });

  const report: FlakyTestReport = {
    generatedAt: new Date().toISOString(),
    config: currentConfig,
    summary: {
      totalTracked: tests.length,
      quarantined: tests.filter(t => t.quarantined).length,
      highFlakiness: tests.filter(t => t.flakinessScore > 0.3).length,
      mediumFlakiness: tests.filter(t => t.flakinessScore > 0.1 && t.flakinessScore <= 0.3).length,
      lowFlakiness: tests.filter(t => t.flakinessScore <= 0.1).length,
      pendingReview: getTestsPendingReview().length,
    },
    patterns: patternCounts,
    tests: tests.sort((a, b) => b.flakinessScore - a.flakinessScore),
    recentlyQuarantined: tests
      .filter(t => t.quarantined && t.quarantinedAt)
      .sort((a, b) => (b.quarantinedAt?.getTime() || 0) - (a.quarantinedAt?.getTime() || 0))
      .slice(0, 10),
    readyForReintegration: getTestsReadyForReintegration(),
  };

  return report;
}

/**
 * Save report to file
 */
export function saveReport(): void {
  const report = generateFlakyReport();
  const reportPath = currentConfig.reportPath;
  const dir = path.dirname(reportPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

/**
 * Load report from file
 */
export function loadReport(): FlakyTestReport | null {
  const reportPath = currentConfig.reportPath;

  if (!fs.existsSync(reportPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(reportPath, 'utf-8');
    return JSON.parse(content) as FlakyTestReport;
  } catch {
    return null;
  }
}

/**
 * Load tests from previous report
 */
export function loadTestsFromReport(): void {
  const report = loadReport();
  if (!report) return;

  for (const test of report.tests) {
    // Convert date strings back to Date objects
    test.firstDetected = new Date(test.firstDetected);
    test.lastRun = new Date(test.lastRun);
    if (test.quarantinedAt) {
      test.quarantinedAt = new Date(test.quarantinedAt);
    }
    test.runHistory = test.runHistory.map(r => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }));

    flakyTestsStore.set(test.testId, test);
  }

  console.log(`[FlakyTracker] Loaded ${report.tests.length} tests from previous report`);
}

/**
 * Configure the flaky tracker
 */
export function configure(config: Partial<QuarantineConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Reset all tracking data
 */
export function resetTracking(): void {
  flakyTestsStore.clear();
}

/**
 * Get current configuration
 */
export function getConfig(): QuarantineConfig {
  return { ...currentConfig };
}

/**
 * Print summary to console
 */
export function printSummary(): void {
  const report = generateFlakyReport();

  console.log('\n========================================');
  console.log('       FLAKY TEST TRACKER SUMMARY       ');
  console.log('========================================\n');

  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Total Tracked: ${report.summary.totalTracked}`);
  console.log(`Quarantined: ${report.summary.quarantined}`);
  console.log(`High Flakiness (>30%): ${report.summary.highFlakiness}`);
  console.log(`Medium Flakiness (10-30%): ${report.summary.mediumFlakiness}`);
  console.log(`Low Flakiness (<10%): ${report.summary.lowFlakiness}`);
  console.log(`Pending Review: ${report.summary.pendingReview}`);

  console.log('\nPattern Distribution:');
  for (const [pattern, count] of Object.entries(report.patterns)) {
    if (count > 0) {
      console.log(`  ${pattern}: ${count}`);
    }
  }

  if (report.recentlyQuarantined.length > 0) {
    console.log('\nRecently Quarantined:');
    for (const test of report.recentlyQuarantined.slice(0, 5)) {
      console.log(`  - ${test.testName} (score: ${test.flakinessScore.toFixed(3)})`);
    }
  }

  if (report.readyForReintegration.length > 0) {
    console.log('\nReady for Reintegration:');
    for (const test of report.readyForReintegration) {
      console.log(`  - ${test.testName} (${test.consecutiveSuccesses} consecutive passes)`);
    }
  }

  console.log('\n========================================\n');
}

/**
 * Playwright test reporter integration
 *
 * Example usage in playwright.config.ts:
 * ```
 * import { playwrightReporter } from './tests/shared/flaky-tracker';
 *
 * export default defineConfig({
 *   reporter: [['html'], playwrightReporter()],
 * });
 * ```
 */
export function playwrightReporter() {
  return {
    onTestEnd(test: any, result: any) {
      recordTestRun({
        testId: test.id || `${test.location.file}:${test.location.line}`,
        testFile: test.location.file,
        testName: test.title,
        passed: result.status === 'passed',
        duration: result.duration,
        timestamp: new Date(),
        error: result.error?.message,
        retryCount: result.retry,
      });
    },
    onEnd() {
      saveReport();
      if (currentConfig.verbose) {
        printSummary();
      }
    },
  };
}

/**
 * Jest test reporter integration
 *
 * Example usage in jest.config.js:
 * ```
 * module.exports = {
 *   reporters: ['default', './tests/shared/flaky-tracker.js'],
 * };
 * ```
 */
export class JestReporter {
  onTestResult(test: any, testResult: any) {
    for (const result of testResult.testResults) {
      recordTestRun({
        testId: `${testResult.testFilePath}:${result.title}`,
        testFile: testResult.testFilePath,
        testName: result.title,
        passed: result.status === 'passed',
        duration: result.duration || 0,
        timestamp: new Date(),
        error: result.failureMessages?.join('\n'),
      });
    }
  }

  onRunComplete() {
    saveReport();
    if (currentConfig.verbose) {
      printSummary();
    }
  }
}
