/**
 * Risk-Based Test Prioritization System
 *
 * Implements intelligent test ordering based on risk scores, historical failures,
 * and domain criticality (financial, auth, UI).
 *
 * For financial systems, compliance areas (SOX, PCI-DSS) receive highest priority.
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @license FREE (Apache 2.0 compatible)
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Risk categories with associated weight
 */
export type RiskCategory =
  | 'financial'       // Financial calculations, Decimal.js operations
  | 'authentication'  // Auth flows, JWT, OAuth
  | 'authorization'   // Permissions, roles, access control
  | 'data-integrity'  // Cross-validation, data consistency
  | 'api-contract'    // Backend API contracts
  | 'user-critical'   // Core user flows
  | 'regulatory'      // SOX, PCI-DSS compliance
  | 'security'        // XSS, CSRF, injection prevention
  | 'integration'     // Third-party integrations
  | 'performance'     // Performance-critical paths
  | 'ui-core'         // Core UI components
  | 'ui-secondary';   // Non-critical UI

/**
 * Risk weights per category (higher = more critical)
 */
export const RISK_WEIGHTS: Record<RiskCategory, number> = {
  financial: 100,         // Highest priority
  regulatory: 95,         // SOX/PCI-DSS compliance
  authentication: 90,
  authorization: 85,
  'data-integrity': 85,
  security: 80,
  'api-contract': 75,
  'user-critical': 70,
  integration: 60,
  performance: 55,
  'ui-core': 50,
  'ui-secondary': 30,
};

/**
 * Test priority record
 */
export interface TestPriority {
  testId: string;
  testFile: string;
  testName: string;
  /** Calculated risk score (0-100) */
  riskScore: number;
  /** Assigned risk categories */
  categories: RiskCategory[];
  /** Last failure date (if any) */
  lastFailure: Date | null;
  /** Total historical failures */
  historicalFailures: number;
  /** Total historical runs */
  historicalRuns: number;
  /** Historical failure rate */
  failureRate: number;
  /** Days since last failure */
  daysSinceFailure: number | null;
  /** Execution time in ms (for optimization) */
  avgExecutionTime: number;
  /** Test layer (1-6 from FASE 156) */
  layer?: number;
  /** Whether test should always run (safety test) */
  isSafetyTest: boolean;
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Configuration for risk-based prioritization
 */
export interface RiskPriorityConfig {
  /** Run critical (score > threshold) tests first */
  criticalThreshold: number;
  /** Recent failure boost (tests that failed recently get higher priority) */
  recentFailureBoostDays: number;
  recentFailureBoostMultiplier: number;
  /** Historical failure weight */
  historicalFailureWeight: number;
  /** Category weight in final score */
  categoryWeight: number;
  /** Enable verbose logging */
  verbose: boolean;
  /** Report file path */
  reportPath: string;
}

/**
 * Default configuration
 */
export const defaultRiskPriorityConfig: RiskPriorityConfig = {
  criticalThreshold: 70,
  recentFailureBoostDays: 7,
  recentFailureBoostMultiplier: 1.5,
  historicalFailureWeight: 0.3,
  categoryWeight: 0.7,
  verbose: false,
  reportPath: 'frontend/reports/risk-priority-report.json',
};

/**
 * Pattern matchers for automatic category detection
 */
const CATEGORY_PATTERNS: Record<RiskCategory, RegExp[]> = {
  financial: [
    /decimal/i,
    /price/i,
    /calculation/i,
    /portfolio/i,
    /dividend/i,
    /asset/i,
    /cross-?validation/i,
    /financial/i,
    /money/i,
    /currency/i,
  ],
  regulatory: [
    /compliance/i,
    /sox/i,
    /pci/i,
    /audit/i,
    /regulatory/i,
  ],
  authentication: [
    /auth/i,
    /login/i,
    /logout/i,
    /jwt/i,
    /token/i,
    /session/i,
    /oauth/i,
  ],
  authorization: [
    /permission/i,
    /role/i,
    /access/i,
    /guard/i,
    /rbac/i,
    /acl/i,
  ],
  'data-integrity': [
    /integrity/i,
    /validation/i,
    /consistency/i,
    /constraint/i,
    /migration/i,
    /schema/i,
  ],
  security: [
    /security/i,
    /xss/i,
    /csrf/i,
    /injection/i,
    /sanitiz/i,
    /encrypt/i,
    /hash/i,
  ],
  'api-contract': [
    /contract/i,
    /api/i,
    /endpoint/i,
    /controller/i,
    /service/i,
    /dto/i,
  ],
  'user-critical': [
    /checkout/i,
    /payment/i,
    /order/i,
    /submit/i,
    /save/i,
    /create/i,
    /delete/i,
  ],
  integration: [
    /integra/i,
    /external/i,
    /third-?party/i,
    /scraper/i,
    /webhook/i,
    /api-?client/i,
  ],
  performance: [
    /performance/i,
    /load/i,
    /stress/i,
    /benchmark/i,
    /latency/i,
    /throughput/i,
  ],
  'ui-core': [
    /dashboard/i,
    /navigation/i,
    /header/i,
    /footer/i,
    /sidebar/i,
    /layout/i,
  ],
  'ui-secondary': [
    /tooltip/i,
    /modal/i,
    /toast/i,
    /animation/i,
    /style/i,
    /theme/i,
  ],
};

/**
 * Safety tests that should ALWAYS run (financial compliance)
 */
const SAFETY_TEST_PATTERNS: RegExp[] = [
  /decimal/i,
  /cross-?validation/i,
  /auth/i,
  /contract/i,
  /financial/i,
  /compliance/i,
  /security/i,
];

/**
 * In-memory priority store
 */
const priorityStore: Map<string, TestPriority> = new Map();

/**
 * Current configuration
 */
let currentConfig: RiskPriorityConfig = { ...defaultRiskPriorityConfig };

/**
 * Detect risk categories from test file path and name
 */
export function detectCategories(testFile: string, testName: string): RiskCategory[] {
  const categories: Set<RiskCategory> = new Set();
  const searchText = `${testFile} ${testName}`.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        categories.add(category as RiskCategory);
        break;
      }
    }
  }

  // Default to ui-secondary if no category detected
  if (categories.size === 0) {
    categories.add('ui-secondary');
  }

  return Array.from(categories);
}

/**
 * Check if test is a safety test (always runs)
 */
export function isSafetyTest(testFile: string, testName: string): boolean {
  const searchText = `${testFile} ${testName}`.toLowerCase();
  return SAFETY_TEST_PATTERNS.some(pattern => pattern.test(searchText));
}

/**
 * Calculate risk score for a test
 */
export function calculateRiskScore(test: TestPriority): number {
  const { categories, failureRate, daysSinceFailure, isSafetyTest } = test;

  // Safety tests always get max score
  if (isSafetyTest) {
    return 100;
  }

  // 1. Category-based score (70% weight by default)
  const categoryScore = categories.reduce((max, cat) => {
    return Math.max(max, RISK_WEIGHTS[cat] || 0);
  }, 0);

  // 2. Historical failure rate boost (30% weight by default)
  const failureBoost = Math.min(failureRate * 100, 30);

  // 3. Recent failure boost
  let recentBoost = 0;
  if (daysSinceFailure !== null && daysSinceFailure <= currentConfig.recentFailureBoostDays) {
    recentBoost = 15 * (1 - daysSinceFailure / currentConfig.recentFailureBoostDays);
  }

  // Calculate weighted score
  let score =
    categoryScore * currentConfig.categoryWeight +
    failureBoost * currentConfig.historicalFailureWeight +
    recentBoost;

  // Apply recent failure multiplier
  if (daysSinceFailure !== null && daysSinceFailure <= currentConfig.recentFailureBoostDays) {
    score *= currentConfig.recentFailureBoostMultiplier;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Register or update a test's priority
 */
export function registerTest(
  testId: string,
  testFile: string,
  testName: string,
  options?: {
    categories?: RiskCategory[];
    layer?: number;
    executionTime?: number;
  }
): TestPriority {
  let test = priorityStore.get(testId);

  const autoCategories = detectCategories(testFile, testName);
  const autoIsSafety = isSafetyTest(testFile, testName);

  if (!test) {
    test = {
      testId,
      testFile,
      testName,
      riskScore: 0,
      categories: options?.categories || autoCategories,
      lastFailure: null,
      historicalFailures: 0,
      historicalRuns: 0,
      failureRate: 0,
      daysSinceFailure: null,
      avgExecutionTime: options?.executionTime || 0,
      layer: options?.layer,
      isSafetyTest: autoIsSafety,
      lastUpdated: new Date(),
    };
  } else {
    // Update with new info
    if (options?.categories) {
      test.categories = options.categories;
    }
    if (options?.layer !== undefined) {
      test.layer = options.layer;
    }
    if (options?.executionTime !== undefined) {
      test.avgExecutionTime =
        (test.avgExecutionTime * 0.8) + (options.executionTime * 0.2); // Weighted average
    }
    test.lastUpdated = new Date();
  }

  // Recalculate risk score
  test.riskScore = calculateRiskScore(test);

  priorityStore.set(testId, test);

  if (currentConfig.verbose) {
    console.log(
      `[RiskPriority] ${testId}: score=${test.riskScore}, ` +
      `categories=[${test.categories.join(',')}], safety=${test.isSafetyTest}`
    );
  }

  return test;
}

/**
 * Record test result for historical tracking
 */
export function recordTestResult(
  testId: string,
  passed: boolean,
  executionTime?: number
): void {
  const test = priorityStore.get(testId);
  if (!test) return;

  test.historicalRuns++;
  if (!passed) {
    test.historicalFailures++;
    test.lastFailure = new Date();
    test.daysSinceFailure = 0;
  }

  // Update failure rate
  test.failureRate = test.historicalRuns > 0
    ? test.historicalFailures / test.historicalRuns
    : 0;

  // Update days since failure
  if (test.lastFailure) {
    const now = new Date();
    test.daysSinceFailure = Math.floor(
      (now.getTime() - test.lastFailure.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Update execution time
  if (executionTime !== undefined) {
    test.avgExecutionTime =
      (test.avgExecutionTime * 0.8) + (executionTime * 0.2);
  }

  // Recalculate risk score
  test.riskScore = calculateRiskScore(test);
  test.lastUpdated = new Date();
}

/**
 * Get prioritized test order
 *
 * Returns tests sorted by:
 * 1. Safety tests first
 * 2. Then by risk score (descending)
 * 3. Then by execution time (ascending, for faster feedback)
 */
export function getPrioritizedTests(options?: {
  limit?: number;
  minScore?: number;
  includeQuarantined?: boolean;
  layers?: number[];
}): TestPriority[] {
  let tests = Array.from(priorityStore.values());

  // Filter by minimum score
  if (options?.minScore !== undefined) {
    tests = tests.filter(t => t.riskScore >= options.minScore!);
  }

  // Filter by layers
  if (options?.layers && options.layers.length > 0) {
    tests = tests.filter(t => t.layer === undefined || options.layers!.includes(t.layer));
  }

  // Sort by priority
  tests.sort((a, b) => {
    // Safety tests always first
    if (a.isSafetyTest && !b.isSafetyTest) return -1;
    if (!a.isSafetyTest && b.isSafetyTest) return 1;

    // Then by risk score (descending)
    if (b.riskScore !== a.riskScore) {
      return b.riskScore - a.riskScore;
    }

    // Then by execution time (ascending - faster tests first for quick feedback)
    return a.avgExecutionTime - b.avgExecutionTime;
  });

  // Apply limit
  if (options?.limit !== undefined) {
    tests = tests.slice(0, options.limit);
  }

  return tests;
}

/**
 * Get critical tests only (above threshold)
 */
export function getCriticalTests(): TestPriority[] {
  return getPrioritizedTests({ minScore: currentConfig.criticalThreshold });
}

/**
 * Get safety tests only
 */
export function getSafetyTests(): TestPriority[] {
  return Array.from(priorityStore.values()).filter(t => t.isSafetyTest);
}

/**
 * Get tests by category
 */
export function getTestsByCategory(category: RiskCategory): TestPriority[] {
  return Array.from(priorityStore.values())
    .filter(t => t.categories.includes(category))
    .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Get test by ID
 */
export function getTestById(testId: string): TestPriority | undefined {
  return priorityStore.get(testId);
}

/**
 * Risk priority report
 */
export interface RiskPriorityReport {
  generatedAt: string;
  config: RiskPriorityConfig;
  summary: {
    totalTests: number;
    criticalTests: number;
    safetyTests: number;
    averageScore: number;
    categoryDistribution: Record<RiskCategory, number>;
  };
  tests: TestPriority[];
  criticalTests: TestPriority[];
  recentlyFailed: TestPriority[];
}

/**
 * Generate risk priority report
 */
export function generateReport(): RiskPriorityReport {
  const tests = Array.from(priorityStore.values());

  // Category distribution
  const categoryDistribution: Record<RiskCategory, number> = {
    financial: 0,
    regulatory: 0,
    authentication: 0,
    authorization: 0,
    'data-integrity': 0,
    security: 0,
    'api-contract': 0,
    'user-critical': 0,
    integration: 0,
    performance: 0,
    'ui-core': 0,
    'ui-secondary': 0,
  };

  tests.forEach(t => {
    t.categories.forEach(c => {
      categoryDistribution[c]++;
    });
  });

  const averageScore = tests.length > 0
    ? tests.reduce((sum, t) => sum + t.riskScore, 0) / tests.length
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    config: currentConfig,
    summary: {
      totalTests: tests.length,
      criticalTests: tests.filter(t => t.riskScore >= currentConfig.criticalThreshold).length,
      safetyTests: tests.filter(t => t.isSafetyTest).length,
      averageScore: Math.round(averageScore * 10) / 10,
      categoryDistribution,
    },
    tests: tests.sort((a, b) => b.riskScore - a.riskScore),
    criticalTests: getCriticalTests(),
    recentlyFailed: tests
      .filter(t => t.daysSinceFailure !== null && t.daysSinceFailure <= 7)
      .sort((a, b) => (a.daysSinceFailure || 999) - (b.daysSinceFailure || 999)),
  };
}

/**
 * Save report to file
 */
export function saveReport(): void {
  const report = generateReport();
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
export function loadReport(): RiskPriorityReport | null {
  const reportPath = currentConfig.reportPath;

  if (!fs.existsSync(reportPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(reportPath, 'utf-8');
    return JSON.parse(content) as RiskPriorityReport;
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
    test.lastFailure = test.lastFailure ? new Date(test.lastFailure) : null;
    test.lastUpdated = new Date(test.lastUpdated);
    priorityStore.set(test.testId, test);
  }

  console.log(`[RiskPriority] Loaded ${report.tests.length} tests from previous report`);
}

/**
 * Configure the risk priority system
 */
export function configure(config: Partial<RiskPriorityConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current configuration
 */
export function getConfig(): RiskPriorityConfig {
  return { ...currentConfig };
}

/**
 * Reset all tracking data
 */
export function resetTracking(): void {
  priorityStore.clear();
}

/**
 * Print summary to console
 */
export function printSummary(): void {
  const report = generateReport();

  console.log('\n========================================');
  console.log('     RISK-BASED TEST PRIORITY SUMMARY   ');
  console.log('========================================\n');

  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Critical Tests (score >= ${currentConfig.criticalThreshold}): ${report.summary.criticalTests}`);
  console.log(`Safety Tests (always run): ${report.summary.safetyTests}`);
  console.log(`Average Score: ${report.summary.averageScore}`);

  console.log('\nCategory Distribution:');
  for (const [category, count] of Object.entries(report.summary.categoryDistribution)) {
    if (count > 0) {
      console.log(`  ${category}: ${count} (weight: ${RISK_WEIGHTS[category as RiskCategory]})`);
    }
  }

  if (report.criticalTests.length > 0) {
    console.log('\nTop 10 Critical Tests:');
    for (const test of report.criticalTests.slice(0, 10)) {
      const safetyTag = test.isSafetyTest ? ' [SAFETY]' : '';
      console.log(`  ${test.riskScore.toString().padStart(3)}: ${test.testName}${safetyTag}`);
    }
  }

  if (report.recentlyFailed.length > 0) {
    console.log('\nRecently Failed (last 7 days):');
    for (const test of report.recentlyFailed.slice(0, 5)) {
      console.log(`  - ${test.testName} (${test.daysSinceFailure}d ago, score: ${test.riskScore})`);
    }
  }

  console.log('\n========================================\n');
}

/**
 * Generate Playwright test filter for priority tests
 *
 * Usage:
 * ```
 * npx playwright test --grep "$(node -e "require('./tests/shared/risk-priority').printGrepPattern()")"
 * ```
 */
export function printGrepPattern(options?: { minScore?: number; limit?: number }): void {
  const tests = getPrioritizedTests(options);
  const pattern = tests.map(t => t.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  console.log(pattern);
}

/**
 * Export test IDs for CI integration
 */
export function exportTestIds(options?: { minScore?: number }): string[] {
  return getPrioritizedTests(options).map(t => t.testId);
}

/**
 * Financial system specific: Get compliance tests
 */
export function getComplianceTests(): TestPriority[] {
  return Array.from(priorityStore.values())
    .filter(t =>
      t.categories.includes('financial') ||
      t.categories.includes('regulatory') ||
      t.categories.includes('data-integrity')
    )
    .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Get tests for quick CI feedback (fast + high priority)
 */
export function getQuickFeedbackTests(maxTimeMs: number = 60000): TestPriority[] {
  return getPrioritizedTests()
    .filter(t => t.avgExecutionTime <= maxTimeMs)
    .slice(0, 20);
}
