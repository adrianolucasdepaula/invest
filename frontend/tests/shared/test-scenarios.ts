/**
 * Standardized Test Scenarios for Multi-Layer Testing Pipeline
 *
 * These 14 scenarios are used across all 6 testing layers:
 * - Layer 1: Playwright Native
 * - Layer 2: Playwright MCP
 * - Layer 3: VS Code Extension
 * - Layer 4: Chrome DevTools MCP
 * - Layer 5: a11y MCP
 * - Layer 6: React Context MCP
 *
 * @see FASE 155 results for historical context
 */

export interface TestScenario {
  id: string;
  name: string;
  category: 'core' | 'edge-case' | 'accessibility';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  knownBugs?: string[]; // e.g., ['BUG-B1', 'BUG-02']
  detectedBy?: string[]; // Which layers detected bugs: ['native', 'mcp', 'a11y']
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

/**
 * Core Scenarios (6) - Fundamental functionality tests
 */
export const coreScenarios: TestScenario[] = [
  {
    id: 'SC-01',
    name: 'Toggle Single Scraper',
    category: 'core',
    severity: 'HIGH',
    description: 'Toggle a single scraper on/off and verify state change',
    knownBugs: ['BUG-02'],
    detectedBy: ['native', 'mcp'],
  },
  {
    id: 'SC-01.1',
    name: 'Debounce Protection',
    category: 'core',
    severity: 'CRITICAL',
    description: 'Test rapid click protection (debounce) - clicks <100ms apart should be ignored',
    knownBugs: ['BUG-B1'],
    detectedBy: ['mcp'], // Only MCP detects this (timing <1ms)
  },
  {
    id: 'SC-02',
    name: 'Advanced Parameters Persistence',
    category: 'core',
    severity: 'MEDIUM',
    description: 'Set advanced parameters and verify they persist without page reload',
    knownBugs: [],
    detectedBy: [],
  },
  {
    id: 'SC-02.1',
    name: 'Parameter Validation',
    category: 'core',
    severity: 'MEDIUM',
    description: 'Test parameter input validation (min/max values, format)',
    knownBugs: [],
    detectedBy: [],
  },
  {
    id: 'SC-03',
    name: 'Apply Profile',
    category: 'core',
    severity: 'HIGH',
    description: 'Apply a parameter profile and verify all scrapers updated',
    knownBugs: [],
    detectedBy: [],
  },
  {
    id: 'SC-03.1',
    name: 'Profile Idempotency',
    category: 'core',
    severity: 'MEDIUM',
    description: 'Apply same profile twice - should yield identical results',
    knownBugs: [],
    detectedBy: [],
  },
];

/**
 * Edge Case Scenarios (5) - Boundary conditions and error handling
 */
export const edgeCaseScenarios: TestScenario[] = [
  {
    id: 'SC-04',
    name: 'Concurrent Toggle Operations',
    category: 'edge-case',
    severity: 'HIGH',
    description: 'Toggle multiple scrapers simultaneously (race condition test)',
    knownBugs: ['BUG-B1'],
    detectedBy: ['mcp'],
  },
  {
    id: 'SC-05',
    name: 'Invalid Input Handling',
    category: 'edge-case',
    severity: 'MEDIUM',
    description: 'Submit invalid parameter values and verify error handling',
    knownBugs: [],
    detectedBy: [],
  },
  {
    id: 'SC-06',
    name: 'Business Rule Enforcement (Min 2 Scrapers)',
    category: 'edge-case',
    severity: 'HIGH',
    description: 'Attempt to disable scraper when only 2 active (should fail with 400)',
    knownBugs: ['BUG-02'],
    detectedBy: ['native', 'mcp'],
  },
  {
    id: 'SC-07',
    name: 'Console Error Detection',
    category: 'edge-case',
    severity: 'MEDIUM',
    description: 'Monitor console for unexpected errors during operations',
    knownBugs: [],
    detectedBy: ['devtools'],
  },
  {
    id: 'SC-08',
    name: 'Network Request Monitoring',
    category: 'edge-case',
    severity: 'MEDIUM',
    description: 'Verify all network requests complete successfully (200/201/400 expected)',
    knownBugs: [],
    detectedBy: ['devtools'],
  },
];

/**
 * Accessibility Scenarios (3) - WCAG 2.1 AA compliance
 */
export const accessibilityScenarios: TestScenario[] = [
  {
    id: 'SC-09',
    name: 'Keyboard Navigation',
    category: 'accessibility',
    severity: 'HIGH',
    description: 'Navigate scraper controls using keyboard only (Tab, Enter, Space)',
    knownBugs: [],
    detectedBy: [],
  },
  {
    id: 'SC-10',
    name: 'Focus Visibility',
    category: 'accessibility',
    severity: 'MEDIUM',
    description: 'Verify focus indicators are visible on all interactive elements',
    knownBugs: ['BUG-C1'],
    detectedBy: ['docker'], // From FASE 155 - Docker tests detected this
  },
  {
    id: 'SC-11',
    name: 'WCAG 2.1 AA Compliance',
    category: 'accessibility',
    severity: 'HIGH',
    description: 'Run Axe-core validation for WCAG 2.1 AA violations',
    knownBugs: ['BUG-E1', 'BUG-E2', 'BUG-E3', 'BUG-E4'],
    detectedBy: ['a11y'], // Only a11y MCP detects WCAG violations
  },
];

/**
 * All scenarios combined (14 total)
 */
export const allScenarios: TestScenario[] = [
  ...coreScenarios,
  ...edgeCaseScenarios,
  ...accessibilityScenarios,
];

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: 'core' | 'edge-case' | 'accessibility'): TestScenario[] {
  return allScenarios.filter(s => s.category === category);
}

/**
 * Get scenarios by severity
 */
export function getScenariosBySeverity(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): TestScenario[] {
  return allScenarios.filter(s => s.severity === severity);
}

/**
 * Get scenario by ID
 */
export function getScenarioById(id: string): TestScenario | undefined {
  return allScenarios.find(s => s.id === id);
}

/**
 * Get scenarios that detected specific bugs
 */
export function getScenariosByBug(bugId: string): TestScenario[] {
  return allScenarios.filter(s => s.knownBugs?.includes(bugId));
}

/**
 * Get scenarios detected by specific layer
 */
export function getScenariosByLayer(layer: string): TestScenario[] {
  return allScenarios.filter(s => s.detectedBy?.includes(layer));
}

/**
 * Scenario execution result interface
 */
export interface ScenarioResult {
  scenarioId: string;
  layer: string; // 'native' | 'mcp' | 'vscode' | 'devtools' | 'a11y' | 'react-context'
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  executionTime: number; // milliseconds
  bugsDetected?: string[];
  errorMessage?: string;
  screenshot?: string; // Path to screenshot if failed
  trace?: string; // Path to trace file if available
  timestamp: Date;
}

/**
 * Test execution context
 */
export interface TestContext {
  baseURL: string;
  storageStatePath?: string; // For authenticated tests
  headless: boolean;
  timeout: number;
  retries: number;
}

/**
 * Default test context
 */
export const defaultTestContext: TestContext = {
  baseURL: 'http://localhost:3100',
  storageStatePath: 'frontend/playwright/.auth/user.json',
  headless: true,
  timeout: 30000,
  retries: 1,
};

/**
 * Scraper IDs for testing (from FASE 155)
 */
export const testScraperIds = {
  BRAPI: 'brapi',
  FUNDAMENTUS: 'fundamentus',
  STATUS_INVEST: 'status-invest',
  YAHOO_FINANCE: 'yahoo-finance',
  B3_OFFICIAL: 'b3-official',
  INVESTING_COM: 'investing-com',
};

/**
 * Test data for parameter validation
 */
export const testParameters = {
  valid: {
    maxRetries: 3,
    timeout: 30000,
    enableCache: true,
    cacheExpiry: 3600,
  },
  invalid: {
    maxRetries: -1, // Should fail validation
    timeout: 0, // Should fail validation
    enableCache: 'yes', // Wrong type
    cacheExpiry: 999999999, // Out of bounds
  },
  boundary: {
    maxRetriesMin: 0,
    maxRetriesMax: 10,
    timeoutMin: 1000,
    timeoutMax: 300000,
  },
};

/**
 * Expected business validation errors
 */
export const expectedErrors = {
  MIN_SCRAPERS: 'Minimum 2 scrapers must remain active',
  INVALID_PARAMETER: 'Parameter value out of allowed range',
  DUPLICATE_OPERATION: 'Operation already in progress',
};

/**
 * Timing constants (from FASE 155 analysis)
 */
export const timingConstants = {
  DEBOUNCE_THRESHOLD: 100, // ms - clicks faster than this should be ignored
  MCP_CLICK_INTERVAL: 1, // ms - MCP can click this fast (exposes race conditions)
  HUMAN_CLICK_INTERVAL: 50, // ms - typical human click speed (masks race conditions)
  REACT_QUERY_REFETCH: 2000, // ms - React Query refetch delay after mutation
  MUTATION_LATENCY: 500, // ms - typical mutation response time
};
