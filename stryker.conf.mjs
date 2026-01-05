/**
 * Stryker Mutation Testing Configuration
 *
 * Mutation testing validates test quality by introducing small changes (mutants)
 * to the code and checking if tests detect them.
 *
 * Stryker is 100% FREE (Apache 2.0 License)
 *
 * CRITICAL: Financial calculation files require 90% mutation score threshold
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see Stryker Docs: https://stryker-mutator.io/docs/stryker-js/configuration/
 * @license FREE (Apache 2.0)
 *
 * Installation:
 * npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  // ==========================================================================
  // PROJECT CONFIGURATION
  // ==========================================================================

  /**
   * Package manager for dependency installation
   */
  packageManager: 'npm',

  /**
   * Files to mutate (introduce bugs)
   * Excludes test files, type definitions, and config files
   */
  mutate: [
    // Backend source files
    'backend/src/**/*.ts',
    // Frontend source files
    'frontend/src/**/*.ts',
    'frontend/src/**/*.tsx',

    // Exclude patterns
    '!backend/src/**/*.spec.ts',
    '!backend/src/**/*.test.ts',
    '!backend/src/**/*.d.ts',
    '!backend/src/**/*.module.ts',
    '!backend/src/main.ts',

    '!frontend/src/**/*.spec.ts',
    '!frontend/src/**/*.spec.tsx',
    '!frontend/src/**/*.test.ts',
    '!frontend/src/**/*.test.tsx',
    '!frontend/src/**/*.d.ts',
    '!frontend/src/**/*.stories.tsx',
  ],

  // ==========================================================================
  // TEST RUNNER CONFIGURATION
  // ==========================================================================

  /**
   * Test runner to use
   * Options: jest, vitest, mocha, karma
   */
  testRunner: 'jest',

  /**
   * Jest configuration options
   */
  jest: {
    projectType: 'custom',
    configFile: 'backend/jest.config.js',
    enableFindRelatedTests: true,
  },

  // ==========================================================================
  // TYPESCRIPT CONFIGURATION
  // ==========================================================================

  /**
   * TypeScript checker to filter out invalid mutants
   * Mutants that cause TypeScript errors are excluded
   */
  checkers: ['typescript'],

  /**
   * Path to tsconfig file
   */
  tsconfigFile: 'backend/tsconfig.json',

  /**
   * TypeScript checker options
   */
  typescriptChecker: {
    // Prioritize performance over accuracy
    // Set to false for stricter checking
    prioritizePerformanceOverAccuracy: true,
  },

  // ==========================================================================
  // REPORTERS
  // ==========================================================================

  /**
   * Reporters for mutation testing results
   */
  reporters: [
    'html',           // Interactive HTML report
    'clear-text',     // Console output
    'progress',       // Progress bar
    'json',           // JSON file for CI integration
    'dashboard',      // Stryker dashboard (if configured)
  ],

  /**
   * Output directory for reports
   */
  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html',
  },

  jsonReporter: {
    fileName: 'reports/mutation/mutation-report.json',
  },

  // ==========================================================================
  // THRESHOLDS
  // ==========================================================================

  /**
   * Mutation score thresholds
   *
   * - high: Green badge (>= 80%)
   * - low: Yellow badge (60-79%)
   * - break: Build fails (< 50%)
   */
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================

  /**
   * Concurrency level
   * Number of parallel test workers
   */
  concurrency: 4,

  /**
   * Timeout for each test run (in ms)
   */
  timeoutMS: 30000,

  /**
   * Timeout factor for slow tests
   */
  timeoutFactor: 1.5,

  /**
   * Maximum test files to run concurrently
   */
  maxTestRunnerReuse: 20,

  // ==========================================================================
  // MUTATORS CONFIGURATION
  // ==========================================================================

  /**
   * Mutators to use
   * Default includes all standard mutators
   */
  mutator: {
    // Use default mutators
    plugins: null,

    // Exclude specific mutators for certain files
    excludedMutations: [
      // Exclude string mutations for log messages
      'StringLiteral',
    ],
  },

  // ==========================================================================
  // IGNORE PATTERNS
  // ==========================================================================

  /**
   * Files to ignore completely
   */
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    'coverage',
    'reports',
    '*.config.js',
    '*.config.ts',
    '*.config.mjs',
  ],

  /**
   * Ignore static mutants (code that's never executed in tests)
   */
  ignoreStatic: true,

  // ==========================================================================
  // DASHBOARD (Optional)
  // ==========================================================================

  /**
   * Stryker Dashboard configuration
   * Requires STRYKER_DASHBOARD_API_KEY environment variable
   */
  dashboard: {
    project: 'github.com/your-org/b3-ai-platform',
    version: process.env.GIT_BRANCH || 'main',
    // Only report in CI
    reportType: process.env.CI ? 'full' : 'mutationScore',
  },

  // ==========================================================================
  // LOGGING
  // ==========================================================================

  /**
   * Log level
   * Options: off, fatal, error, warn, info, debug, trace
   */
  logLevel: 'info',

  /**
   * Log to file
   */
  fileLogLevel: 'info',

  // ==========================================================================
  // INCREMENTAL MODE
  // ==========================================================================

  /**
   * Enable incremental mode for faster subsequent runs
   * Only mutates changed files
   */
  incremental: true,
  incrementalFile: '.stryker-cache/incremental.json',

  // ==========================================================================
  // WARNINGS
  // ==========================================================================

  /**
   * Warn on slow tests
   */
  warnings: true,

  /**
   * Disable bail on first failing test
   * Run all tests even if some fail
   */
  disableBail: false,
};

export default config;

// =============================================================================
// FINANCIAL CRITICAL FILES CONFIGURATION
// =============================================================================

/**
 * Critical financial files that require 90% mutation score
 *
 * Run with:
 * npx stryker run --mutate "backend/src/validators/cross-validation.service.ts"
 */
export const FINANCIAL_CRITICAL_FILES = [
  // Cross-validation (consensus algorithm)
  'backend/src/validators/cross-validation.service.ts',

  // Decimal operations
  'backend/src/utils/decimal.ts',
  'frontend/src/lib/utils/decimal.ts',

  // Financial calculations
  'backend/src/services/calculation/*.ts',
  'frontend/src/lib/calculations/*.ts',

  // Data transformers (normalize financial data)
  'backend/src/transformers/*.ts',

  // Portfolio calculations
  'backend/src/services/portfolio-calculation.service.ts',
  'frontend/src/lib/calculations/portfolio.ts',

  // Options Greeks calculations (WHEEL strategy)
  'frontend/src/lib/calculations/options-greeks.ts',
];

/**
 * Run mutation testing only on financial critical files with strict threshold
 *
 * Usage:
 * npx stryker run --mutate "backend/src/validators/**/*.ts" -- --threshold.break 90
 */
export const FINANCIAL_CONFIG = {
  ...config,
  mutate: FINANCIAL_CRITICAL_FILES,
  thresholds: {
    high: 95,
    low: 85,
    break: 90, // STRICT: Build fails if < 90%
  },
};

// =============================================================================
// CI/CD INTEGRATION HELPERS
// =============================================================================

/**
 * GitHub Actions workflow example:
 *
 * ```yaml
 * - name: Run Mutation Testing
 *   run: npx stryker run
 *   env:
 *     CI: true
 *     GIT_BRANCH: ${{ github.ref_name }}
 *
 * - name: Run Financial Critical Mutation Testing
 *   run: npx stryker run --mutate "backend/src/validators/**/*.ts"
 *   env:
 *     CI: true
 * ```
 */

/**
 * NPM scripts to add to package.json:
 *
 * ```json
 * {
 *   "scripts": {
 *     "mutation": "stryker run",
 *     "mutation:financial": "stryker run --mutate 'backend/src/validators/**/*.ts,backend/src/utils/decimal.ts'",
 *     "mutation:incremental": "stryker run --incremental"
 *   }
 * }
 * ```
 */
