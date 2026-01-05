/**
 * Test Pipeline Orchestration Script
 *
 * Executes the complete 6-layer testing pipeline in the correct order:
 * 1. Layer 1: Playwright Native (baseline)
 * 2. Layer 2: Playwright MCP (validation)
 * 3. Layer 3: VS Code Extension (conditional debug)
 * 4-6. Layers 4-6: DevTools, a11y, React Context (parallel)
 *
 * Generates comprehensive pipeline summary with bug comparison matrix.
 *
 * Usage:
 *   npx ts-node frontend/scripts/run-test-pipeline.ts [config]
 *
 * Configs:
 *   development  - All layers, parallel execution
 *   ci           - Fast layers only (Native + MCP + a11y)
 *   debug        - Native + VS Code + DevTools
 *
 * @see Plan: foamy-singing-toast.md - Pipeline specification
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

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
  },
};

// ============================================================================
// MAIN PIPELINE EXECUTOR
// ============================================================================

async function runTestPipeline(configName: string = 'development'): Promise<void> {
  const config = configs[configName];
  if (!config) {
    console.error(`❌ Unknown config: ${configName}`);
    console.error(`Available configs: ${Object.keys(configs).join(', ')}`);
    process.exit(1);
  }

  console.log('\n🚀 Starting Test Pipeline\n');
  console.log(`Config: ${configName}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const startTime = Date.now();
  const results: Record<string, unknown> = {
    native: null,
    mcp: null,
    vscode: null,
    devtools: null,
    a11y: null,
    reactContext: null,
  };

  try {
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

    // Generate comprehensive pipeline report
    const totalTime = Date.now() - startTime;
    console.log('\n📊 Generating pipeline summary...\n');

    const summary = generatePipelineSummary(results, totalTime);
    savePipelineReport(summary);

    // Print final summary
    printFinalSummary(summary);

    console.log('\n✅ Pipeline completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Pipeline failed:', (error as Error).message);
    process.exit(1);
  }
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
