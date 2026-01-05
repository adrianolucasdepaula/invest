/**
 * Test Impact Analysis (TIA) Engine
 *
 * Implements intelligent test selection based on code changes.
 * Combines static analysis (dependency graphs) with dynamic coverage data.
 *
 * Expected ROI: 70-90% reduction in CI time
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see Martin Fowler TIA: https://martinfowler.com/articles/rise-test-impact-analysis.html
 * @license FREE (Apache 2.0 compatible)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Test mapping entry
 */
export interface TestMapping {
  sourceFile: string;
  affectedTests: string[];
  /** Lines covered by tests (from Istanbul/NYC) */
  coverageLines?: number[];
  /** Last time this mapping was updated */
  lastUpdated: Date;
  /** Confidence level of the mapping */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * TIA Configuration
 */
export interface TIAConfig {
  // Static analysis
  /** Use import/export analysis */
  dependencyGraph: boolean;
  /** Use manual file ownership mapping */
  fileOwnership: boolean;

  // Dynamic analysis
  /** Use Istanbul/NYC coverage data */
  runtimeCoverage: boolean;
  /** Coverage confidence threshold (0-1) */
  coverageThreshold: number;

  // Safety
  /** Fallback to full test run if coverage is stale */
  fallbackToFull: boolean;
  /** Maximum hours before coverage is considered stale */
  coverageMaxAgeHours: number;
  /** Tests that ALWAYS run (financial compliance) */
  safetyTests: string[];
  /** Maximum percentage of tests to skip (safety limit) */
  maxSkipPercentage: number;

  // Paths
  /** Coverage data file path */
  coveragePath: string;
  /** Mapping cache file path */
  mappingCachePath: string;
  /** Test files pattern */
  testPattern: string;

  /** Enable verbose logging */
  verbose: boolean;
}

/**
 * Default configuration
 */
export const defaultTIAConfig: TIAConfig = {
  dependencyGraph: true,
  fileOwnership: true,
  runtimeCoverage: true,
  coverageThreshold: 0.8,
  fallbackToFull: true,
  coverageMaxAgeHours: 24,
  safetyTests: [
    // Financial compliance tests (ALWAYS run)
    '**/decimal*.spec.ts',
    '**/cross-validation*.spec.ts',
    '**/financial*.spec.ts',
    // Auth tests (ALWAYS run)
    '**/auth*.spec.ts',
    '**/authentication*.spec.ts',
    // Contract tests (ALWAYS run)
    '**/contracts/*.spec.ts',
    '**/contract*.spec.ts',
    // Security tests (ALWAYS run)
    '**/security*.spec.ts',
  ],
  maxSkipPercentage: 0.9,
  coveragePath: 'coverage/coverage-final.json',
  mappingCachePath: 'frontend/reports/tia-mapping.json',
  testPattern: '**/*.spec.ts',
  verbose: false,
};

/**
 * TIA Analysis Result
 */
export interface TIAResult {
  /** Tests to run */
  testsToRun: string[];
  /** Tests that can be skipped */
  testsSkipped: string[];
  /** Reason for the selection */
  reason: 'tia_optimized' | 'stale_coverage' | 'full_run' | 'no_changes' | 'safety_only';
  /** Analysis metadata */
  metadata: {
    changedFiles: string[];
    totalTests: number;
    selectedTests: number;
    skippedTests: number;
    skipPercentage: number;
    analysisTime: number;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  /** Safety tests that were force-included */
  safetyTestsIncluded: string[];
}

/**
 * Coverage data format (Istanbul/NYC)
 */
interface CoverageData {
  [filepath: string]: {
    path: string;
    statementMap: Record<string, any>;
    fnMap: Record<string, any>;
    branchMap: Record<string, any>;
    s: Record<string, number>;
    f: Record<string, number>;
    b: Record<string, number[]>;
  };
}

/**
 * Current configuration
 */
let currentConfig: TIAConfig = { ...defaultTIAConfig };

/**
 * Cached mappings
 */
let mappingCache: Map<string, TestMapping> = new Map();

/**
 * Get changed files from git
 */
export function getChangedFiles(
  baseRef: string = 'HEAD~1',
  targetRef: string = 'HEAD'
): string[] {
  try {
    const output = execSync(`git diff --name-only ${baseRef}...${targetRef}`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(f => path.resolve(process.cwd(), f));
  } catch (error) {
    console.error('[TIA] Failed to get changed files:', error);
    return [];
  }
}

/**
 * Get all test files
 */
export function getAllTestFiles(pattern?: string): string[] {
  const glob = require('glob');
  const testPattern = pattern || currentConfig.testPattern;

  try {
    const files = glob.sync(testPattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    return files;
  } catch {
    // Fallback: use fs to find test files
    const testFiles: string[] = [];
    const searchDirs = ['frontend/tests', 'frontend/src', 'backend/src'];

    for (const dir of searchDirs) {
      const fullDir = path.join(process.cwd(), dir);
      if (fs.existsSync(fullDir)) {
        walkDir(fullDir, testFiles);
      }
    }

    return testFiles.filter(f => f.endsWith('.spec.ts') || f.endsWith('.test.ts'));
  }
}

function walkDir(dir: string, results: string[]): void {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules') {
      walkDir(fullPath, results);
    } else if (file.endsWith('.spec.ts') || file.endsWith('.test.ts')) {
      results.push(fullPath);
    }
  }
}

/**
 * Static analysis: Get tests affected by import chain
 */
export function getTestsByDependencyGraph(changedFiles: string[]): Set<string> {
  const affectedTests = new Set<string>();
  const allTests = getAllTestFiles();

  for (const testFile of allTests) {
    const imports = getImports(testFile);

    for (const changedFile of changedFiles) {
      // Direct import
      if (imports.some(imp => imp.includes(path.basename(changedFile, path.extname(changedFile))))) {
        affectedTests.add(testFile);
        break;
      }

      // Check if changed file is in the same directory
      if (path.dirname(changedFile) === path.dirname(testFile)) {
        affectedTests.add(testFile);
        break;
      }

      // Check transitive imports (one level)
      for (const imp of imports) {
        const impFile = resolveImport(imp, testFile);
        if (impFile) {
          const impImports = getImports(impFile);
          if (impImports.some(i => i.includes(path.basename(changedFile, path.extname(changedFile))))) {
            affectedTests.add(testFile);
            break;
          }
        }
      }
    }
  }

  return affectedTests;
}

/**
 * Get imports from a TypeScript file
 */
function getImports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](.*)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  } catch {
    return [];
  }
}

/**
 * Resolve import path to absolute path
 */
function resolveImport(importPath: string, fromFile: string): string | null {
  // Skip node_modules
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    return null;
  }

  const dir = path.dirname(fromFile);
  let resolved: string;

  if (importPath.startsWith('@/')) {
    // Handle alias (common in Next.js)
    resolved = path.join(process.cwd(), 'frontend/src', importPath.slice(2));
  } else {
    resolved = path.resolve(dir, importPath);
  }

  // Try extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
  for (const ext of extensions) {
    const fullPath = resolved + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Check if it's already a full path
  if (fs.existsSync(resolved)) {
    return resolved;
  }

  return null;
}

/**
 * Dynamic analysis: Get tests from coverage data
 */
export function getTestsFromCoverage(changedFiles: string[]): Set<string> {
  const affectedTests = new Set<string>();

  if (!fs.existsSync(currentConfig.coveragePath)) {
    if (currentConfig.verbose) {
      console.log('[TIA] No coverage data found');
    }
    return affectedTests;
  }

  try {
    const coverageData: CoverageData = JSON.parse(
      fs.readFileSync(currentConfig.coveragePath, 'utf-8')
    );

    for (const changedFile of changedFiles) {
      const relativePath = path.relative(process.cwd(), changedFile);

      // Check if this file is in coverage data
      const coverageEntry = Object.entries(coverageData).find(
        ([filePath]) => filePath.includes(relativePath) || relativePath.includes(filePath)
      );

      if (coverageEntry) {
        // Find tests that cover this file from mapping
        const mapping = mappingCache.get(changedFile);
        if (mapping) {
          mapping.affectedTests.forEach(t => affectedTests.add(t));
        }
      }
    }
  } catch (error) {
    console.error('[TIA] Failed to parse coverage data:', error);
  }

  return affectedTests;
}

/**
 * File ownership: Manual mapping for critical areas
 */
const FILE_OWNERSHIP: Record<string, string[]> = {
  // Backend controllers → related tests
  'backend/src/api/': ['**/api/**/*.spec.ts', '**/contract*.spec.ts'],

  // Frontend pages → E2E tests
  'frontend/src/app/': ['**/e2e/**/*.spec.ts', '**/pages/**/*.spec.ts'],

  // Database migrations → DB tests
  'backend/src/database/migrations/': ['**/migration*.spec.ts', '**/database*.spec.ts'],

  // Financial calculations → Financial tests (CRITICAL)
  'backend/src/validators/': ['**/cross-validation*.spec.ts', '**/validation*.spec.ts'],
  'frontend/src/lib/calculations/': ['**/calculation*.spec.ts', '**/financial*.spec.ts'],

  // Auth → Auth tests (CRITICAL)
  'backend/src/auth/': ['**/auth*.spec.ts'],
  'frontend/src/app/(auth)/': ['**/auth*.spec.ts'],

  // Components → Component tests
  'frontend/src/components/': ['**/components/**/*.spec.ts'],
};

/**
 * Get tests from file ownership mapping
 */
export function getTestsByOwnership(changedFiles: string[]): Set<string> {
  const affectedTests = new Set<string>();
  const allTests = getAllTestFiles();

  for (const changedFile of changedFiles) {
    for (const [pathPattern, testPatterns] of Object.entries(FILE_OWNERSHIP)) {
      if (changedFile.includes(pathPattern)) {
        for (const testPattern of testPatterns) {
          // Match test pattern
          const regex = new RegExp(
            testPattern
              .replace(/\*\*/g, '.*')
              .replace(/\*/g, '[^/]*')
          );

          for (const test of allTests) {
            if (regex.test(test)) {
              affectedTests.add(test);
            }
          }
        }
      }
    }
  }

  return affectedTests;
}

/**
 * Get safety tests (always run)
 */
export function getSafetyTests(): string[] {
  const allTests = getAllTestFiles();
  const safetyTests: string[] = [];

  for (const pattern of currentConfig.safetyTests) {
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
    );

    for (const test of allTests) {
      if (regex.test(test) && !safetyTests.includes(test)) {
        safetyTests.push(test);
      }
    }
  }

  return safetyTests;
}

/**
 * Check if coverage data is stale
 */
export function isCoverageStale(): boolean {
  if (!fs.existsSync(currentConfig.coveragePath)) {
    return true;
  }

  try {
    const stats = fs.statSync(currentConfig.coveragePath);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    return ageHours > currentConfig.coverageMaxAgeHours;
  } catch {
    return true;
  }
}

/**
 * Main TIA analysis function
 */
export async function analyzeImpact(options?: {
  baseRef?: string;
  targetRef?: string;
  changedFiles?: string[];
}): Promise<TIAResult> {
  const startTime = Date.now();

  // Get changed files
  const changedFiles = options?.changedFiles ||
    getChangedFiles(options?.baseRef, options?.targetRef);

  if (changedFiles.length === 0) {
    return {
      testsToRun: getSafetyTests(),
      testsSkipped: [],
      reason: 'no_changes',
      metadata: {
        changedFiles: [],
        totalTests: getAllTestFiles().length,
        selectedTests: getSafetyTests().length,
        skippedTests: 0,
        skipPercentage: 0,
        analysisTime: Date.now() - startTime,
        confidenceLevel: 'high',
      },
      safetyTestsIncluded: getSafetyTests(),
    };
  }

  // Check for stale coverage
  if (currentConfig.fallbackToFull && isCoverageStale()) {
    const allTests = getAllTestFiles();
    return {
      testsToRun: allTests,
      testsSkipped: [],
      reason: 'stale_coverage',
      metadata: {
        changedFiles,
        totalTests: allTests.length,
        selectedTests: allTests.length,
        skippedTests: 0,
        skipPercentage: 0,
        analysisTime: Date.now() - startTime,
        confidenceLevel: 'low',
      },
      safetyTestsIncluded: getSafetyTests(),
    };
  }

  // Collect affected tests from all sources
  const affectedTests = new Set<string>();

  // 1. Dependency graph analysis
  if (currentConfig.dependencyGraph) {
    const depTests = getTestsByDependencyGraph(changedFiles);
    depTests.forEach(t => affectedTests.add(t));

    if (currentConfig.verbose) {
      console.log(`[TIA] Dependency graph: ${depTests.size} tests`);
    }
  }

  // 2. File ownership mapping
  if (currentConfig.fileOwnership) {
    const ownershipTests = getTestsByOwnership(changedFiles);
    ownershipTests.forEach(t => affectedTests.add(t));

    if (currentConfig.verbose) {
      console.log(`[TIA] File ownership: ${ownershipTests.size} tests`);
    }
  }

  // 3. Runtime coverage data
  if (currentConfig.runtimeCoverage) {
    const coverageTests = getTestsFromCoverage(changedFiles);
    coverageTests.forEach(t => affectedTests.add(t));

    if (currentConfig.verbose) {
      console.log(`[TIA] Coverage data: ${coverageTests.size} tests`);
    }
  }

  // 4. Always include safety tests
  const safetyTests = getSafetyTests();
  safetyTests.forEach(t => affectedTests.add(t));

  // Calculate results
  const allTests = getAllTestFiles();
  const testsToRun = Array.from(affectedTests);
  const testsSkipped = allTests.filter(t => !affectedTests.has(t));

  // Check skip percentage limit
  const skipPercentage = testsSkipped.length / allTests.length;
  if (skipPercentage > currentConfig.maxSkipPercentage) {
    // Too aggressive, run all tests
    return {
      testsToRun: allTests,
      testsSkipped: [],
      reason: 'full_run',
      metadata: {
        changedFiles,
        totalTests: allTests.length,
        selectedTests: allTests.length,
        skippedTests: 0,
        skipPercentage: 0,
        analysisTime: Date.now() - startTime,
        confidenceLevel: 'medium',
      },
      safetyTestsIncluded: safetyTests,
    };
  }

  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
  if (!currentConfig.runtimeCoverage || isCoverageStale()) {
    confidenceLevel = 'medium';
  }
  if (skipPercentage > 0.7) {
    confidenceLevel = confidenceLevel === 'high' ? 'medium' : 'low';
  }

  return {
    testsToRun,
    testsSkipped,
    reason: 'tia_optimized',
    metadata: {
      changedFiles,
      totalTests: allTests.length,
      selectedTests: testsToRun.length,
      skippedTests: testsSkipped.length,
      skipPercentage,
      analysisTime: Date.now() - startTime,
      confidenceLevel,
    },
    safetyTestsIncluded: safetyTests,
  };
}

/**
 * Configure TIA
 */
export function configure(config: Partial<TIAConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current configuration
 */
export function getConfig(): TIAConfig {
  return { ...currentConfig };
}

/**
 * Save mapping cache
 */
export function saveMappingCache(): void {
  const data = Object.fromEntries(mappingCache);
  const dir = path.dirname(currentConfig.mappingCachePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(currentConfig.mappingCachePath, JSON.stringify(data, null, 2));
}

/**
 * Load mapping cache
 */
export function loadMappingCache(): void {
  if (!fs.existsSync(currentConfig.mappingCachePath)) {
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(currentConfig.mappingCachePath, 'utf-8'));
    mappingCache = new Map(Object.entries(data));
    console.log(`[TIA] Loaded ${mappingCache.size} mappings from cache`);
  } catch {
    mappingCache = new Map();
  }
}

/**
 * Update mapping from test result
 */
export function updateMapping(sourceFile: string, testFile: string): void {
  let mapping = mappingCache.get(sourceFile);

  if (!mapping) {
    mapping = {
      sourceFile,
      affectedTests: [],
      lastUpdated: new Date(),
      confidence: 'medium',
    };
  }

  if (!mapping.affectedTests.includes(testFile)) {
    mapping.affectedTests.push(testFile);
  }

  mapping.lastUpdated = new Date();
  mappingCache.set(sourceFile, mapping);
}

/**
 * Print analysis summary
 */
export function printSummary(result: TIAResult): void {
  console.log('\n========================================');
  console.log('     TEST IMPACT ANALYSIS SUMMARY       ');
  console.log('========================================\n');

  console.log(`Reason: ${result.reason}`);
  console.log(`Changed Files: ${result.metadata.changedFiles.length}`);
  console.log(`Total Tests: ${result.metadata.totalTests}`);
  console.log(`Tests to Run: ${result.metadata.selectedTests}`);
  console.log(`Tests Skipped: ${result.metadata.skippedTests}`);
  console.log(`Skip Percentage: ${(result.metadata.skipPercentage * 100).toFixed(1)}%`);
  console.log(`Analysis Time: ${result.metadata.analysisTime}ms`);
  console.log(`Confidence: ${result.metadata.confidenceLevel}`);

  if (result.safetyTestsIncluded.length > 0) {
    console.log(`\nSafety Tests (always run): ${result.safetyTestsIncluded.length}`);
  }

  if (result.metadata.changedFiles.length > 0 && result.metadata.changedFiles.length <= 10) {
    console.log('\nChanged Files:');
    result.metadata.changedFiles.forEach(f => {
      console.log(`  - ${path.relative(process.cwd(), f)}`);
    });
  }

  if (result.testsToRun.length <= 20) {
    console.log('\nTests to Run:');
    result.testsToRun.forEach(t => {
      console.log(`  - ${path.relative(process.cwd(), t)}`);
    });
  }

  console.log('\n========================================\n');
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let baseRef = 'HEAD~1';
  let targetRef = 'HEAD';
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      baseRef = args[i + 1];
      i++;
    } else if (args[i] === '--target' && args[i + 1]) {
      targetRef = args[i + 1];
      i++;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    }
  }

  configure({ verbose });
  loadMappingCache();

  const result = await analyzeImpact({ baseRef, targetRef });
  printSummary(result);

  // Output test files for CI integration
  if (result.testsToRun.length > 0) {
    console.log('# Run these tests:');
    console.log(result.testsToRun.map(t => path.relative(process.cwd(), t)).join('\n'));
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
