/**
 * Bug Tracking and Comparison for Multi-Layer Testing Pipeline
 *
 * Tracks bugs detected across all 6 testing layers and generates
 * comparison matrices to identify which layers detect which bugs.
 *
 * @see FASE 155 results for historical bug catalog
 */

import { saveJSON, loadJSON } from './helpers';
import type { ScenarioResult } from './test-scenarios';

/**
 * Bug severity levels
 */
export type BugSeverity = 'CRITICAL' | 'SERIOUS' | 'MEDIUM' | 'LOW';

/**
 * Testing layers
 */
export type TestLayer =
  | 'native'
  | 'mcp'
  | 'vscode'
  | 'devtools'
  | 'a11y'
  | 'react-context';

/**
 * Bug definition
 */
export interface Bug {
  id: string; // e.g., 'BUG-B1', 'BUG-E1'
  severity: BugSeverity;
  title: string;
  description: string;
  detectedBy: TestLayer[];
  missedBy: TestLayer[];
  scenarioIds: string[]; // Which scenarios detect this bug
  rootCause?: string;
  fix?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'WONT_FIX';
}

/**
 * Known bugs catalog (from FASE 155)
 */
export const knownBugs: Bug[] = [
  {
    id: 'BUG-B1',
    severity: 'CRITICAL',
    title: 'Race Condition in Toggle Debounce',
    description: 'Rapid clicks (<100ms apart) can bypass debounce protection due to React state batching race condition',
    detectedBy: ['mcp'],
    missedBy: ['native', 'vscode'],
    scenarioIds: ['SC-01.1', 'SC-04'],
    rootCause: 'MCP timing <1ms exposes race condition that human-like timing (50-100ms) masks',
    fix: 'Add isLocked state to ScraperCard component with useOptimistic hook',
    status: 'OPEN',
  },
  {
    id: 'BUG-02',
    severity: 'MEDIUM',
    title: 'Business Rule Blocks Workflow',
    description: 'Min 2 scrapers business rule prevents legitimate testing workflows',
    detectedBy: ['native', 'mcp'],
    missedBy: [],
    scenarioIds: ['SC-06'],
    rootCause: 'Backend validation too restrictive for valid use cases',
    status: 'OPEN',
  },
  {
    id: 'BUG-03',
    severity: 'MEDIUM',
    title: 'Test State Pollution',
    description: 'Previous test state affects subsequent tests without proper cleanup',
    detectedBy: ['native'],
    missedBy: ['mcp', 'vscode'], // Masked by auto-setup
    scenarioIds: ['SC-01', 'SC-02'],
    rootCause: 'React Query cache not cleared between tests',
    status: 'OPEN',
  },
  {
    id: 'BUG-C1',
    severity: 'MEDIUM',
    title: 'Focus Not Visible',
    description: 'Focus indicators missing or insufficient contrast on interactive elements',
    detectedBy: [],
    missedBy: ['native', 'mcp', 'vscode'],
    scenarioIds: ['SC-10'],
    rootCause: 'CSS outline removed without accessible alternative',
    status: 'OPEN',
  },
  {
    id: 'BUG-E1',
    severity: 'SERIOUS',
    title: 'Color Contrast Below WCAG AA',
    description: 'Text color contrast ratio <4.5:1, violates WCAG 2.1 AA standard',
    detectedBy: ['a11y'],
    missedBy: ['native', 'mcp', 'vscode', 'devtools'],
    scenarioIds: ['SC-11'],
    rootCause: 'Design system colors not tested for accessibility',
    status: 'OPEN',
  },
  {
    id: 'BUG-E2',
    severity: 'MEDIUM',
    title: 'Missing ARIA Labels',
    description: 'Interactive elements lack descriptive ARIA labels for screen readers',
    detectedBy: ['a11y'],
    missedBy: ['native', 'mcp', 'vscode', 'devtools'],
    scenarioIds: ['SC-11'],
    rootCause: 'Shadcn/ui components not customized with proper labels',
    status: 'OPEN',
  },
  {
    id: 'BUG-E3',
    severity: 'MEDIUM',
    title: 'Form Validation Not Announced',
    description: 'Form errors not announced to screen readers (missing aria-live)',
    detectedBy: ['a11y'],
    missedBy: ['native', 'mcp', 'vscode', 'devtools'],
    scenarioIds: ['SC-11'],
    rootCause: 'Error messages rendered without ARIA live region',
    status: 'OPEN',
  },
  {
    id: 'BUG-E4',
    severity: 'MEDIUM',
    title: 'Semantic HTML Structure Issues',
    description: 'Improper heading hierarchy and landmark regions',
    detectedBy: ['a11y'],
    missedBy: ['native', 'mcp', 'vscode', 'devtools'],
    scenarioIds: ['SC-11'],
    rootCause: 'Next.js App Router layout not using semantic HTML5 elements',
    status: 'OPEN',
  },
];

/**
 * Bug comparison result
 */
export interface BugComparisonResult {
  bugId: string;
  detectedBy: TestLayer[];
  missedBy: TestLayer[];
  uniqueToLayer?: TestLayer; // Only this layer detected it
  detectionReason?: string;
}

/**
 * Layer comparison matrix
 */
export interface LayerComparison {
  layer: TestLayer;
  bugsDetected: string[];
  uniqueBugs: string[]; // Bugs only this layer detected
  sharedBugs: string[]; // Bugs detected by other layers too
  missedBugs: string[]; // Bugs this layer should have detected but didn't
}

/**
 * Pipeline summary report
 */
export interface PipelineSummary {
  executionDate: string;
  totalExecutionTime: number;
  layersRun: number;
  totalBugs: number;
  criticalBugs: number;
  seriousBugs: number;
  mediumBugs: number;
  lowBugs: number;
  wcagCompliance: 'PASS' | 'FAIL';
  overallPassRate: number;
  layerResults: Record<TestLayer, LayerResult>;
  bugComparison: BugComparisonResult[];
  recommendations: string[];
}

/**
 * Layer test result
 */
export interface LayerResult {
  passRate: number;
  bugsDetected: string[];
  uniqueBugs: string[];
  executionTime: number;
  scenarios: ScenarioResult[];
}

/**
 * Compare bugs detected across layers
 */
export function compareBugs(
  nativeResults: ScenarioResult[],
  mcpResults: ScenarioResult[]
): BugComparisonResult[] {
  const nativeBugs = extractBugsFromResults(nativeResults);
  const mcpBugs = extractBugsFromResults(mcpResults);

  const uniqueToMCP = mcpBugs.filter(bug => !nativeBugs.includes(bug));
  const uniqueToNative = nativeBugs.filter(bug => !mcpBugs.includes(bug));

  const comparisons: BugComparisonResult[] = [];

  // Process all known bugs
  for (const bug of knownBugs) {
    const detectedByNative = nativeBugs.includes(bug.id);
    const detectedByMCP = mcpBugs.includes(bug.id);

    const detectedBy: TestLayer[] = [];
    const missedBy: TestLayer[] = [];

    if (detectedByNative) detectedBy.push('native');
    else missedBy.push('native');

    if (detectedByMCP) detectedBy.push('mcp');
    else missedBy.push('mcp');

    let uniqueToLayer: TestLayer | undefined;
    if (uniqueToMCP.includes(bug.id)) uniqueToLayer = 'mcp';
    if (uniqueToNative.includes(bug.id)) uniqueToLayer = 'native';

    comparisons.push({
      bugId: bug.id,
      detectedBy,
      missedBy,
      uniqueToLayer,
      detectionReason: getDetectionReason(bug, uniqueToLayer),
    });
  }

  return comparisons;
}

/**
 * Extract bug IDs from scenario results
 */
export function extractBugsFromResults(results: ScenarioResult[]): string[] {
  const bugs = new Set<string>();

  for (const result of results) {
    if (result.bugsDetected) {
      result.bugsDetected.forEach(bug => bugs.add(bug));
    }
  }

  return Array.from(bugs);
}

/**
 * Get detection reason based on bug and layer
 */
function getDetectionReason(bug: Bug, layer?: TestLayer): string | undefined {
  if (!layer) return undefined;

  const reasons: Record<string, Record<TestLayer, string>> = {
    'BUG-B1': {
      mcp: 'MCP timing <1ms exposes race condition that human-like timing masks',
      native: '',
      vscode: '',
      devtools: '',
      a11y: '',
      'react-context': '',
    },
    'BUG-E1': {
      a11y: 'Only a11y MCP tests WCAG color contrast compliance',
      native: '',
      mcp: '',
      vscode: '',
      devtools: '',
      'react-context': '',
    },
  };

  return reasons[bug.id]?.[layer];
}

/**
 * Generate layer comparison matrix
 */
export function generateLayerComparison(
  layerResults: Record<TestLayer, ScenarioResult[]>
): LayerComparison[] {
  const comparisons: LayerComparison[] = [];
  const layers = Object.keys(layerResults) as TestLayer[];

  for (const layer of layers) {
    const results = layerResults[layer];
    const bugsDetected = extractBugsFromResults(results);

    // Find unique bugs (only this layer detected)
    const uniqueBugs = bugsDetected.filter(bug => {
      const otherLayers = layers.filter(l => l !== layer);
      return otherLayers.every(otherLayer => {
        const otherBugs = extractBugsFromResults(layerResults[otherLayer]);
        return !otherBugs.includes(bug);
      });
    });

    // Find shared bugs (detected by other layers too)
    const sharedBugs = bugsDetected.filter(bug => !uniqueBugs.includes(bug));

    // Find missed bugs (should have detected but didn't)
    const missedBugs = knownBugs
      .filter(bug => bug.missedBy.includes(layer))
      .map(bug => bug.id);

    comparisons.push({
      layer,
      bugsDetected,
      uniqueBugs,
      sharedBugs,
      missedBugs,
    });
  }

  return comparisons;
}

/**
 * Generate pipeline summary report
 */
export function generatePipelineSummary(
  layerResults: Record<TestLayer, LayerResult>
): PipelineSummary {
  const layers = Object.keys(layerResults) as TestLayer[];
  const allBugs = new Set<string>();
  let totalExecutionTime = 0;
  let totalScenarios = 0;
  let totalPassed = 0;

  // Aggregate data from all layers
  for (const layer of layers) {
    const result = layerResults[layer];
    result.bugsDetected.forEach(bug => allBugs.add(bug));
    totalExecutionTime += result.executionTime;

    const scenariosCount = result.scenarios.length;
    const passedCount = result.scenarios.filter(s => s.status === 'PASSED').length;
    totalScenarios += scenariosCount;
    totalPassed += passedCount;
  }

  // Count bugs by severity
  const bugsList = Array.from(allBugs);
  const criticalBugs = bugsList.filter(id =>
    knownBugs.find(b => b.id === id && b.severity === 'CRITICAL')
  ).length;

  const seriousBugs = bugsList.filter(id =>
    knownBugs.find(b => b.id === id && b.severity === 'SERIOUS')
  ).length;

  const mediumBugs = bugsList.filter(id =>
    knownBugs.find(b => b.id === id && b.severity === 'MEDIUM')
  ).length;

  const lowBugs = bugsList.filter(id =>
    knownBugs.find(b => b.id === id && b.severity === 'LOW')
  ).length;

  // WCAG compliance check
  const wcagBugs = ['BUG-E1', 'BUG-E2', 'BUG-E3', 'BUG-E4'];
  const hasWCAGViolations = wcagBugs.some(bug => allBugs.has(bug));
  const wcagCompliance = hasWCAGViolations ? 'FAIL' : 'PASS';

  // Overall pass rate
  const overallPassRate = totalScenarios > 0 ? totalPassed / totalScenarios : 0;

  // Generate bug comparison
  const scenarioResults: Partial<Record<TestLayer, ScenarioResult[]>> = {};
  for (const layer of layers) {
    scenarioResults[layer] = layerResults[layer].scenarios;
  }
  const bugComparison = generateBugComparison(scenarioResults as Record<TestLayer, ScenarioResult[]>);

  // Generate recommendations
  const recommendations = generateRecommendations(bugsList, wcagCompliance, overallPassRate);

  return {
    executionDate: new Date().toISOString(),
    totalExecutionTime,
    layersRun: layers.length,
    totalBugs: bugsList.length,
    criticalBugs,
    seriousBugs,
    mediumBugs,
    lowBugs,
    wcagCompliance,
    overallPassRate,
    layerResults,
    bugComparison,
    recommendations,
  };
}

/**
 * Generate bug comparison from all layer results
 */
function generateBugComparison(
  layerResults: Record<TestLayer, ScenarioResult[]>
): BugComparisonResult[] {
  const comparisons: BugComparisonResult[] = [];
  const layers = Object.keys(layerResults) as TestLayer[];

  for (const bug of knownBugs) {
    const detectedBy: TestLayer[] = [];
    const missedBy: TestLayer[] = [];

    for (const layer of layers) {
      const bugs = extractBugsFromResults(layerResults[layer]);
      if (bugs.includes(bug.id)) {
        detectedBy.push(layer);
      } else {
        missedBy.push(layer);
      }
    }

    // Check if bug is unique to one layer
    let uniqueToLayer: TestLayer | undefined;
    if (detectedBy.length === 1) {
      uniqueToLayer = detectedBy[0];
    }

    comparisons.push({
      bugId: bug.id,
      detectedBy,
      missedBy,
      uniqueToLayer,
      detectionReason: getDetectionReason(bug, uniqueToLayer),
    });
  }

  return comparisons;
}

/**
 * Generate recommendations based on results
 */
function generateRecommendations(
  bugsDetected: string[],
  wcagCompliance: 'PASS' | 'FAIL',
  overallPassRate: number
): string[] {
  const recommendations: string[] = [];

  // Critical bugs
  if (bugsDetected.includes('BUG-B1')) {
    recommendations.push('Fix BUG-B1 (CRITICAL) immediately - race condition in toggle debounce');
  }

  // WCAG violations
  if (wcagCompliance === 'FAIL') {
    if (bugsDetected.includes('BUG-E1')) {
      recommendations.push('Fix BUG-E1 (SERIOUS) - color contrast WCAG violation');
    }
    recommendations.push('Consider fixing BUG-E2, E3, E4 for full WCAG compliance');
  }

  // Pass rate
  if (overallPassRate < 0.6) {
    recommendations.push('Overall pass rate below 60% - investigate failures systematically');
  }

  // Business logic
  if (bugsDetected.includes('BUG-02')) {
    recommendations.push('Review BUG-02 business rule - may be blocking legitimate workflows');
  }

  return recommendations;
}

/**
 * Save pipeline summary to file
 */
export function savePipelineSummary(summary: PipelineSummary): void {
  const filepath = 'frontend/reports/pipeline-summary.json';
  saveJSON(filepath, summary);
  console.log(`✅ Pipeline summary saved to: ${filepath}`);
}

/**
 * Save bug comparison matrix to file
 */
export function saveBugComparison(comparisons: BugComparisonResult[]): void {
  const filepath = 'frontend/reports/bug-comparison.json';
  saveJSON(filepath, comparisons);
  console.log(`✅ Bug comparison saved to: ${filepath}`);
}

/**
 * Save layer comparison to file
 */
export function saveLayerComparison(comparisons: LayerComparison[]): void {
  const filepath = 'frontend/reports/layer-comparison.json';
  saveJSON(filepath, comparisons);
  console.log(`✅ Layer comparison saved to: ${filepath}`);
}

/**
 * Load previous pipeline results for comparison
 */
export function loadPreviousSummary(): PipelineSummary | null {
  return loadJSON<PipelineSummary>('frontend/reports/pipeline-summary.json');
}

/**
 * Print bug summary to console
 */
export function printBugSummary(bugs: string[]): void {
  console.log('\n📊 Bug Detection Summary:\n');

  const bugsByCategory = {
    critical: bugs.filter(id => knownBugs.find(b => b.id === id && b.severity === 'CRITICAL')),
    serious: bugs.filter(id => knownBugs.find(b => b.id === id && b.severity === 'SERIOUS')),
    medium: bugs.filter(id => knownBugs.find(b => b.id === id && b.severity === 'MEDIUM')),
    low: bugs.filter(id => knownBugs.find(b => b.id === id && b.severity === 'LOW')),
  };

  console.log(`🔴 CRITICAL: ${bugsByCategory.critical.length} (${bugsByCategory.critical.join(', ') || 'none'})`);
  console.log(`🟠 SERIOUS:  ${bugsByCategory.serious.length} (${bugsByCategory.serious.join(', ') || 'none'})`);
  console.log(`🟡 MEDIUM:   ${bugsByCategory.medium.length} (${bugsByCategory.medium.join(', ') || 'none'})`);
  console.log(`🟢 LOW:      ${bugsByCategory.low.length} (${bugsByCategory.low.join(', ') || 'none'})`);
  console.log(`\n📈 TOTAL:    ${bugs.length} unique bugs detected\n`);
}
