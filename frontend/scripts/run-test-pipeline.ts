/**
 * Test Pipeline Orchestration Script
 *
 * Executes the complete 6-layer testing pipeline in the correct order:
 * 1. Layer 1: Playwright Native (baseline)
 * 2. Layer 2: Playwright MCP (validation)
 * 3. Layer 3: VS Code Extension (conditional debug)
 * 4-6. Layers 4-6: DevTools, a11y, React Context (parallel)
 *
 * FASE 158 Enhancements:
 * - Test Impact Analysis (TIA) for intelligent test selection
 * - Flaky Test Detection & Quarantine
 * - Risk-Based Test Prioritization
 * - Self-Healing Locators integration
 *
 * Generates comprehensive pipeline summary with bug comparison matrix.
 *
 * Usage:
 *   npx ts-node frontend/scripts/run-test-pipeline.ts [config] [flags]
 *
 * Configs:
 *   development  - All layers, parallel execution
 *   ci           - Fast layers only (Native + MCP + a11y)
 *   debug        - Native + VS Code + DevTools
 *   optimized    - TIA + Risk-first + Flaky quarantine (FASE 158)
 *
 * Flags:
 *   --use-tia             Enable Test Impact Analysis
 *   --use-flaky-quarantine Enable flaky test quarantine
 *   --risk-first          Order tests by risk priority
 *   --skip-chaos          Skip chaos engineering scenarios
 *
 * @see Plan: foamy-singing-toast.md - Pipeline specification
 * @see FASE 158: Universal Validation Flow v3.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

// FASE 158: Import advanced testing tools
import {
  analyzeImpact,
  TIAResult,
  configure as configureTIA,
  printSummary as printTIASummary,
} from './test-impact-analysis';

import {
  recordTestRun,
  shouldSkipTest,
  getQuarantinedTests,
  generateFlakyReport,
  loadTestsFromReport as loadFlakyReport,
  printSummary as printFlakySummary,
  configure as configureFlakyTracker,
} from '../tests/shared/flaky-tracker';

import {
  getPrioritizedTests,
  getCriticalTests,
  getSafetyTests as getRiskSafetyTests,
  generateReport as generateRiskReport,
  loadTestsFromReport as loadRiskReport,
  printSummary as printRiskSummary,
  configure as configureRiskPriority,
} from '../tests/shared/risk-priority';

import {
  generateHealingReport,
  printHealingSummary,
} from '../tests/shared/self-healing';

// FASE 158: Chaos Engineering
import {
  runAllScenarios as runChaosScenarios,
  ChaosResult,
} from './chaos-scenarios';

const execAsync = promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

interface PipelineConfig {
  runNative: boolean;
  runMCP: boolean;
  runVSCode: boolean;
  runDevTools: boolean;
  runA11y: boolean;
  runReactContext: boolean;
  stopOnFailure: boolean;
  parallelExecution: boolean;
  // FASE 158: Advanced testing features
  useTIA: boolean;                    // Test Impact Analysis
  useFlakyQuarantine: boolean;        // Flaky test quarantine
  useRiskPriority: boolean;           // Risk-based test ordering
  runChaosScenarios: boolean;         // Chaos engineering
}

// FASE 158: CLI flags
interface CLIFlags {
  useTIA: boolean;
  useFlakyQuarantine: boolean;
  riskFirst: boolean;
  skipChaos: boolean;
}

const configs: Record<string, PipelineConfig> = {
  development: {
    runNative: true,
    runMCP: true,
    runVSCode: true,
    runDevTools: true,
    runA11y: true,
    runReactContext: true,
    stopOnFailure: false,
    parallelExecution: true,
    useTIA: false,
    useFlakyQuarantine: false,
    useRiskPriority: false,
    runChaosScenarios: false,
  },
  ci: {
    runNative: true,
    runMCP: true,
    runVSCode: false,
    runDevTools: false,
    runA11y: true,
    runReactContext: false,
    stopOnFailure: true,
    parallelExecution: true,
    useTIA: true,                      // FASE 158: TIA enabled for CI
    useFlakyQuarantine: true,          // FASE 158: Quarantine in CI
    useRiskPriority: true,             // FASE 158: Critical first
    runChaosScenarios: false,
  },
  debug: {
    runNative: true,
    runMCP: false,
    runVSCode: true,
    runDevTools: true,
    runA11y: false,
    runReactContext: false,
    stopOnFailure: false,
    parallelExecution: false,
    useTIA: false,
    useFlakyQuarantine: false,
    useRiskPriority: false,
    runChaosScenarios: false,
  },
  // FASE 158: New optimized config with all advanced features
  optimized: {
    runNative: true,
    runMCP: true,
    runVSCode: false,
    runDevTools: true,
    runA11y: true,
    runReactContext: false,
    stopOnFailure: false,
    parallelExecution: true,
    useTIA: true,                      // Test Impact Analysis
    useFlakyQuarantine: true,          // Flaky quarantine
    useRiskPriority: true,             // Risk-first ordering
    runChaosScenarios: true,           // Chaos engineering
  },
};

// ============================================================================
// MAIN PIPELINE EXECUTOR
// ============================================================================

// FASE 158: Parse CLI flags
function parseCLIFlags(): CLIFlags {
  const args = process.argv.slice(2);
  return {
    useTIA: args.includes('--use-tia'),
    useFlakyQuarantine: args.includes('--use-flaky-quarantine'),
    riskFirst: args.includes('--risk-first'),
    skipChaos: args.includes('--skip-chaos'),
  };
}

// FASE 158: Pre-pipeline analysis
async function runPrePipelineAnalysis(config: PipelineConfig): Promise<{
  tiaResult?: TIAResult;
  quarantinedTests: string[];
  prioritizedTests: string[];
}> {
  const result: {
    tiaResult?: TIAResult;
    quarantinedTests: string[];
    prioritizedTests: string[];
  } = {
    quarantinedTests: [],
    prioritizedTests: [],
  };

  console.log('\n📊 FASE 158: Pre-Pipeline Analysis\n');
  console.log('═'.repeat(60));

  // Load historical data
  loadFlakyReport();
  loadRiskReport();

  // TIA: Test Impact Analysis
  if (config.useTIA) {
    console.log('\n🔍 Running Test Impact Analysis (TIA)...');
    try {
      result.tiaResult = await analyzeImpact();
      printTIASummary(result.tiaResult);
      console.log(`   Tests to run: ${result.tiaResult.testsToRun.length}`);
      console.log(`   Tests skipped: ${result.tiaResult.testsSkipped.length}`);
      console.log(`   Optimization: ${result.tiaResult.metadata.skipPercentage.toFixed(1)}% reduction`);
    } catch (error) {
      console.warn('   ⚠️ TIA analysis failed, running all tests');
    }
  }

  // Flaky Quarantine
  if (config.useFlakyQuarantine) {
    console.log('\n🧪 Checking Flaky Test Quarantine...');
    const quarantined = getQuarantinedTests();
    result.quarantinedTests = quarantined.map(t => t.testId);
    console.log(`   Quarantined tests: ${result.quarantinedTests.length}`);
    if (result.quarantinedTests.length > 0) {
      console.log('   Quarantined:');
      result.quarantinedTests.slice(0, 5).forEach(id => console.log(`     - ${id}`));
      if (result.quarantinedTests.length > 5) {
        console.log(`     ... and ${result.quarantinedTests.length - 5} more`);
      }
    }
  }

  // Risk Priority
  if (config.useRiskPriority) {
    console.log('\n⚡ Analyzing Risk Priority...');
    const critical = getCriticalTests();
    const safety = getRiskSafetyTests();
    console.log(`   Critical tests: ${critical.length}`);
    console.log(`   Safety tests: ${safety.length}`);

    const prioritized = getPrioritizedTests({ includeQuarantined: !config.useFlakyQuarantine });
    result.prioritizedTests = prioritized.map(t => t.testId);
    console.log(`   Total prioritized: ${result.prioritizedTests.length}`);
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  return result;
}

// FASE 158: Execute Chaos Engineering Scenarios
async function executeChaosScenarios(config: PipelineConfig): Promise<{
  results: ChaosResult[];
  passed: number;
  failed: number;
  skipped: boolean;
}> {
  if (!config.runChaosScenarios) {
    return {
      results: [],
      passed: 0,
      failed: 0,
      skipped: true,
    };
  }

  console.log('\n🌪️  [CHAOS] Running Chaos Engineering Scenarios...\n');
  console.log('═'.repeat(60));

  try {
    const results = await runChaosScenarios();
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n🌪️  [CHAOS] Chaos Scenarios Complete');
    console.log(`   Passed: ${passed}/${results.length}`);
    console.log(`   Failed: ${failed}/${results.length}`);
    console.log(`   Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

    return {
      results,
      passed,
      failed,
      skipped: false,
    };
  } catch (error) {
    console.error('🌪️  [CHAOS] Error running chaos scenarios:', error);
    return {
      results: [],
      passed: 0,
      failed: 0,
      skipped: false,
    };
  }
}

// FASE 158: Post-pipeline reports
function printFase158Reports(config: PipelineConfig): void {
  if (!config.useTIA && !config.useFlakyQuarantine && !config.useRiskPriority) {
    return;
  }

  console.log('\n📈 FASE 158: Post-Pipeline Reports\n');
  console.log('═'.repeat(60));

  if (config.useFlakyQuarantine) {
    console.log('\n🧪 Flaky Test Report:');
    printFlakySummary();
  }

  if (config.useRiskPriority) {
    console.log('\n⚡ Risk Priority Report:');
    printRiskSummary();
  }

  // Self-healing report
  const healingReport = generateHealingReport();
  if (healingReport.totalElements > 0) {
    console.log('\n🔧 Self-Healing Report:');
    printHealingSummary();
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

async function runTestPipeline(configName: string = 'development'): Promise<void> {
  const config = configs[configName];
  const cliFlags = parseCLIFlags();

  // Apply CLI flags to config
  if (cliFlags.useTIA) config.useTIA = true;
  if (cliFlags.useFlakyQuarantine) config.useFlakyQuarantine = true;
  if (cliFlags.riskFirst) config.useRiskPriority = true;
  if (cliFlags.skipChaos) config.runChaosScenarios = false;

  if (!config) {
    console.error(`❌ Unknown config: ${configName}`);
    console.error(`Available configs: ${Object.keys(configs).join(', ')}`);
    process.exit(1);
  }

  console.log('\n🚀 Starting Test Pipeline (FASE 158 Enhanced)\n');
  console.log(`Config: ${configName}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`FASE 158 Features:`);
  console.log(`  - TIA: ${config.useTIA ? '✅' : '❌'}`);
  console.log(`  - Flaky Quarantine: ${config.useFlakyQuarantine ? '✅' : '❌'}`);
  console.log(`  - Risk Priority: ${config.useRiskPriority ? '✅' : '❌'}`);
  console.log(`  - Chaos Scenarios: ${config.runChaosScenarios ? '✅' : '❌'}`);
  console.log('');

  const startTime = Date.now();
  const results: Record<string, unknown> = {
    native: null,
    mcp: null,
    vscode: null,
    devtools: null,
    a11y: null,
    reactContext: null,
    fase158: null,  // FASE 158 analysis results
  };

  try {
    // FASE 158: Pre-pipeline analysis
    const preAnalysis = await runPrePipelineAnalysis(config);
    // LAYER 1: Playwright Native (BASELINE)
    if (config.runNative) {
      console.log('🔵 [1/6] Running Layer 1: Playwright Native (baseline)...\n');
      results.native = await runNativeTests();

      if (config.stopOnFailure && isFailureAboveThreshold(results.native, 0.6)) {
        throw new Error('Layer 1 failed baseline - stopping pipeline');
      }
    }

    // LAYER 2: Playwright MCP (VALIDATION)
    if (config.runMCP) {
      console.log('\n🟢 [2/6] Running Layer 2: Playwright MCP (validation)...\n');
      results.mcp = await runMCPTests();

      // Compare bugs between Layer 1 and Layer 2
      if (results.native && results.mcp) {
        const comparison = compareLayers(results.native, results.mcp);
        if (comparison.uniqueToMCP.length > 0) {
          console.log(`\n🔴 MCP detected additional bugs: ${comparison.uniqueToMCP.join(', ')}\n`);
        }
      }
    }

    // LAYER 3: VS Code Extension (DEBUG - conditional)
    if (config.runVSCode) {
      const shouldDebug = shouldRunVSCodeDebug(results.native, results.mcp);

      if (shouldDebug) {
        console.log('\n🟡 [3/6] Running Layer 3: VS Code Extension (debug mode)...\n');
        results.vscode = await runVSCodeTests();
      } else {
        console.log('\n⏭️  [3/6] Skipping Layer 3: VS Code (no debug needed)\n');
      }
    }

    // LAYERS 4-6: Parallel execution (independent)
    if (config.parallelExecution) {
      console.log('\n⚡ [4-6/6] Running Layers 4-6 in parallel...\n');

      const parallelTasks = [];

      if (config.runDevTools) {
        parallelTasks.push(
          runDevToolsTests().then(result => {
            results.devtools = result;
            console.log('  ✅ Layer 4: DevTools complete');
          })
        );
      }

      if (config.runA11y) {
        parallelTasks.push(
          runA11yTests().then(result => {
            results.a11y = result;
            console.log('  ✅ Layer 5: a11y complete');
          })
        );
      }

      if (config.runReactContext) {
        parallelTasks.push(
          runReactContextTests().then(result => {
            results.reactContext = result;
            console.log('  ✅ Layer 6: React Context complete');
          })
        );
      }

      await Promise.all(parallelTasks);
      console.log('\n⚡ Parallel execution complete\n');
    } else {
      // Sequential execution
      if (config.runDevTools) {
        console.log('\n🟣 [4/6] Running Layer 4: DevTools...\n');
        results.devtools = await runDevToolsTests();
      }

      if (config.runA11y) {
        console.log('\n🟠 [5/6] Running Layer 5: a11y...\n');
        results.a11y = await runA11yTests();
      }

      if (config.runReactContext) {
        console.log('\n🔴 [6/6] Running Layer 6: React Context...\n');
        results.reactContext = await runReactContextTests();
      }
    }

    // FASE 158: Run Chaos Engineering Scenarios
    const chaosResults = await executeChaosScenarios(config);

    // Generate comprehensive pipeline report
    const totalTime = Date.now() - startTime;
    console.log('\n📊 Generating pipeline summary...\n');

    // Store FASE 158 analysis results
    results.fase158 = {
      tiaResult: preAnalysis.tiaResult,
      quarantinedTests: preAnalysis.quarantinedTests,
      prioritizedTests: preAnalysis.prioritizedTests,
      healingReport: generateHealingReport(),
      flakyReport: config.useFlakyQuarantine ? generateFlakyReport() : null,
      riskReport: config.useRiskPriority ? generateRiskReport() : null,
      chaosResults: chaosResults,  // FASE 158: Chaos Engineering results
    };

    const summary = generatePipelineSummary(results, totalTime);
    savePipelineReport(summary);

    // Print final summary
    printFinalSummary(summary);

    // FASE 158: Print advanced reports
    printFase158Reports(config);

    // Save FASE 158 reports
    saveFase158Reports(config);

    console.log('\n✅ Pipeline completed successfully (FASE 158 Enhanced)!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Pipeline failed:', (error as Error).message);
    process.exit(1);
  }
}

// FASE 158: Save advanced reports
function saveFase158Reports(config: PipelineConfig): void {
  const reportsDir = path.join(__dirname, '../reports/fase-158');

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (config.useFlakyQuarantine) {
    const flakyReport = generateFlakyReport();
    fs.writeFileSync(
      path.join(reportsDir, `flaky-report-${timestamp}.json`),
      JSON.stringify(flakyReport, null, 2)
    );
  }

  if (config.useRiskPriority) {
    const riskReport = generateRiskReport();
    fs.writeFileSync(
      path.join(reportsDir, `risk-report-${timestamp}.json`),
      JSON.stringify(riskReport, null, 2)
    );
  }

  const healingReport = generateHealingReport();
  if (healingReport.totalElements > 0) {
    fs.writeFileSync(
      path.join(reportsDir, `healing-report-${timestamp}.json`),
      JSON.stringify(healingReport, null, 2)
    );
  }

  console.log(`✅ FASE 158 reports saved to: ${reportsDir}`);
}

// ============================================================================
// LAYER EXECUTORS
// ============================================================================

async function runNativeTests(): Promise<unknown> {
  try {
    const { stdout, stderr } = await execAsync(
      'npx playwright test frontend/tests/integration-pipeline/01-baseline-native.spec.ts',
      { cwd: path.resolve(__dirname, '../..'), maxBuffer: 1024 * 1024 * 10 }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    return loadLayerResult('layer-native-results.json');
  } catch (error) {
    console.error('Layer 1 error:', error);
    return loadLayerResult('layer-native-results.json'); // Return partial results
  }
}

async function runMCPTests(): Promise<unknown> {
  try {
    const { stdout, stderr } = await execAsync(
      'npx playwright test frontend/tests/integration-pipeline/02-validation-mcp.spec.ts',
      { cwd: path.resolve(__dirname, '../..'), maxBuffer: 1024 * 1024 * 10 }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    return loadLayerResult('layer-mcp-results.json');
  } catch (error) {
    console.error('Layer 2 error:', error);
    return loadLayerResult('layer-mcp-results.json');
  }
}

async function runVSCodeTests(): Promise<unknown> {
  try {
    const { stdout, stderr } = await execAsync(
      'npx playwright test frontend/tests/integration-pipeline/03-debug-vscode.spec.ts',
      { cwd: path.resolve(__dirname, '../..'), maxBuffer: 1024 * 1024 * 10 }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    return loadLayerResult('layer-vscode-results.json');
  } catch (error) {
    console.error('Layer 3 error:', error);
    return loadLayerResult('layer-vscode-results.json');
  }
}

async function runDevToolsTests(): Promise<unknown> {
  try {
    const { stdout, stderr } = await execAsync(
      'npx playwright test frontend/tests/integration-pipeline/04-devtools-mcp.spec.ts',
      { cwd: path.resolve(__dirname, '../..'), maxBuffer: 1024 * 1024 * 10 }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    return loadLayerResult('layer-devtools-results.json');
  } catch (error) {
    console.error('Layer 4 error:', error);
    return loadLayerResult('layer-devtools-results.json');
  }
}

async function runA11yTests(): Promise<unknown> {
  try {
    const { stdout, stderr } = await execAsync(
      'npx playwright test frontend/tests/integration-pipeline/05-accessibility-a11y.spec.ts',
      { cwd: path.resolve(__dirname, '../..'), maxBuffer: 1024 * 1024 * 10 }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    return loadLayerResult('layer-a11y-results.json');
  } catch (error) {
    console.error('Layer 5 error:', error);
    return loadLayerResult('layer-a11y-results.json');
  }
}

async function runReactContextTests(): Promise<unknown> {
  try {
    const { stdout, stderr } = await execAsync(
      'npx playwright test frontend/tests/integration-pipeline/06-components-react.spec.ts',
      { cwd: path.resolve(__dirname, '../..'), maxBuffer: 1024 * 1024 * 10 }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    return loadLayerResult('layer-react-context-results.json');
  } catch (error) {
    console.error('Layer 6 error:', error);
    return loadLayerResult('layer-react-context-results.json');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadLayerResult(filename: string): unknown {
  const filepath = path.join(__dirname, '../reports', filename);
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
  return null;
}

function isFailureAboveThreshold(result: unknown, threshold: number): boolean {
  if (!result || typeof result !== 'object') return false;
  const passRate = (result as { passRate?: number }).passRate;
  return passRate !== undefined && passRate < threshold;
}

function shouldRunVSCodeDebug(nativeResult: unknown, mcpResult: unknown): boolean {
  const nativeFailures = getFailureCount(nativeResult);
  const mcpFailures = getFailureCount(mcpResult);

  return nativeFailures > 3 || mcpFailures > 3;
}

function getFailureCount(result: unknown): number {
  if (!result || typeof result !== 'object') return 0;
  const scenarios = (result as { scenarios?: Array<{ status: string }> }).scenarios;
  return scenarios?.filter(s => s.status === 'FAILED').length || 0;
}

function compareLayers(layer1: unknown, layer2: unknown): { uniqueToMCP: string[] } {
  const bugs1 = getBugsFromResult(layer1);
  const bugs2 = getBugsFromResult(layer2);

  const uniqueToMCP = bugs2.filter(bug => !bugs1.includes(bug));

  return { uniqueToMCP };
}

function getBugsFromResult(result: unknown): string[] {
  if (!result || typeof result !== 'object') return [];
  return (result as { bugsDetected?: string[] }).bugsDetected || [];
}

function generatePipelineSummary(results: Record<string, unknown>, totalTime: number): unknown {
  const allBugs = new Set<string>();
  let totalScenarios = 0;
  let totalPassed = 0;
  const layersRun: string[] = [];

  Object.entries(results).forEach(([layer, result]) => {
    if (result && typeof result === 'object') {
      layersRun.push(layer);

      const bugs = (result as { bugsDetected?: string[] }).bugsDetected || [];
      bugs.forEach(bug => allBugs.add(bug));

      const scenarios = (result as { scenarios?: Array<{ status: string }> }).scenarios || [];
      totalScenarios += scenarios.length;
      totalPassed += scenarios.filter(s => s.status === 'PASSED').length;
    }
  });

  const overallPassRate = totalScenarios > 0 ? totalPassed / totalScenarios : 0;

  return {
    executionDate: new Date().toISOString(),
    totalExecutionTime: totalTime,
    layersRun: layersRun.length,
    totalBugs: allBugs.size,
    overallPassRate,
    bugsDetected: Array.from(allBugs),
    layerResults: results,
  };
}

function savePipelineReport(summary: unknown): void {
  const filepath = path.join(__dirname, '../reports/pipeline-summary.json');
  fs.writeFileSync(filepath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`✅ Pipeline summary saved: ${filepath}`);
}

function printFinalSummary(summary: unknown): void {
  if (!summary || typeof summary !== 'object') return;

  const s = summary as {
    layersRun?: number;
    totalBugs?: number;
    overallPassRate?: number;
    totalExecutionTime?: number;
    bugsDetected?: string[];
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                PIPELINE SUMMARY                            ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Layers Executed: ${s.layersRun}`);
  console.log(`Bugs Detected: ${s.totalBugs}`);
  console.log(`Overall Pass Rate: ${((s.overallPassRate || 0) * 100).toFixed(1)}%`);
  console.log(`Total Time: ${formatDuration(s.totalExecutionTime || 0)}\n`);

  if (s.bugsDetected && s.bugsDetected.length > 0) {
    console.log('🐛 Bugs Found:');
    s.bugsDetected.forEach(bug => {
      console.log(`  - ${bug}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;

  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

const configArg = process.argv[2] || 'development';
runTestPipeline(configArg);
