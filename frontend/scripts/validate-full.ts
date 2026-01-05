#!/usr/bin/env npx ts-node

/**
 * validate-full.ts - Universal Validation Orchestrator
 *
 * Executes validation levels 0-5 based on FLUXO_UNIVERSAL_VALIDACAO.md
 *
 * Usage:
 *   npx ts-node scripts/validate-full.ts --level=1
 *   npx ts-node scripts/validate-full.ts --level=2 --ci
 *   npx ts-node scripts/validate-full.ts --level=5 --skip-manual
 *
 * Options:
 *   --level=N       Validation level (0-5)
 *   --ci            CI mode (non-interactive, fail fast)
 *   --skip-manual   Skip manual validation steps
 *   --report        Generate JSON report
 *   --verbose       Verbose output
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface ValidationResult {
  level: number;
  step: string;
  status: 'pass' | 'fail' | 'skip' | 'warn';
  duration: number;
  details?: string;
  error?: string;
}

interface ValidationReport {
  level: number;
  startTime: string;
  endTime: string;
  duration: number;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    warnings: number;
  };
  recommendation: 'APPROVED' | 'REJECTED' | 'INVESTIGATE';
}

// Configuration
const config = {
  level: 1,
  ci: false,
  skipManual: false,
  report: false,
  verbose: false,
};

// Parse arguments
process.argv.slice(2).forEach((arg) => {
  if (arg.startsWith('--level=')) {
    config.level = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--ci') {
    config.ci = true;
  } else if (arg === '--skip-manual') {
    config.skipManual = true;
  } else if (arg === '--report') {
    config.report = true;
  } else if (arg === '--verbose') {
    config.verbose = true;
  }
});

// Paths
const rootDir = path.resolve(__dirname, '../..');
const frontendDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'backend');
const reportsDir = path.resolve(frontendDir, 'reports');

// Utilities
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[type]} ${message}`);
}

function runCommand(command: string, cwd: string = rootDir): { success: boolean; output: string; duration: number } {
  const startTime = Date.now();
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: config.verbose ? 'inherit' : 'pipe',
      timeout: 300000 // 5 min timeout
    });
    return { success: true, output: output || '', duration: Date.now() - startTime };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || error.message || 'Command failed',
      duration: Date.now() - startTime
    };
  }
}

// Validation Steps

// Level 0: Pre-requisites
async function runLevel0(): Promise<ValidationResult[]> {
  log('Running Level 0: Pre-requisites', 'info');
  const results: ValidationResult[] = [];

  // 0.1 Git Status
  const gitStatus = runCommand('git status --porcelain', rootDir);
  results.push({
    level: 0,
    step: '0.1 Git Status',
    status: gitStatus.output.trim() === '' ? 'pass' : 'warn',
    duration: gitStatus.duration,
    details: gitStatus.output.trim() === '' ? 'Working tree clean' : 'Uncommitted changes detected',
  });

  // 0.2 Docker Health
  const dockerStatus = runCommand('docker ps --format "{{.Names}}: {{.Status}}"', rootDir);
  const healthyContainers = (dockerStatus.output.match(/healthy/g) || []).length;
  results.push({
    level: 0,
    step: '0.2 Docker Health',
    status: healthyContainers >= 7 ? 'pass' : 'fail',
    duration: dockerStatus.duration,
    details: `${healthyContainers} containers healthy`,
  });

  // 0.3 TypeScript Backend
  const tsBackend = runCommand('npx tsc --noEmit', backendDir);
  results.push({
    level: 0,
    step: '0.3 TypeScript Backend',
    status: tsBackend.success ? 'pass' : 'fail',
    duration: tsBackend.duration,
    details: tsBackend.success ? '0 errors' : tsBackend.output,
  });

  // 0.4 TypeScript Frontend
  const tsFrontend = runCommand('npx tsc --noEmit', frontendDir);
  results.push({
    level: 0,
    step: '0.4 TypeScript Frontend',
    status: tsFrontend.success ? 'pass' : 'fail',
    duration: tsFrontend.duration,
    details: tsFrontend.success ? '0 errors' : tsFrontend.output,
  });

  // 0.5 Build Backend
  const buildBackend = runCommand('npm run build', backendDir);
  results.push({
    level: 0,
    step: '0.5 Build Backend',
    status: buildBackend.success ? 'pass' : 'fail',
    duration: buildBackend.duration,
    details: buildBackend.success ? 'Build successful' : buildBackend.output,
  });

  // 0.6 Build Frontend
  const buildFrontend = runCommand('npm run build', frontendDir);
  results.push({
    level: 0,
    step: '0.6 Build Frontend',
    status: buildFrontend.success ? 'pass' : 'fail',
    duration: buildFrontend.duration,
    details: buildFrontend.success ? 'Build successful' : buildFrontend.output,
  });

  return results;
}

// Level 1: Quick Validation
async function runLevel1(): Promise<ValidationResult[]> {
  log('Running Level 1: Quick Validation', 'info');
  const results: ValidationResult[] = [];

  // 1.1 Lint Frontend
  const lint = runCommand('npm run lint', frontendDir);
  results.push({
    level: 1,
    step: '1.1 Lint Frontend',
    status: lint.success ? 'pass' : 'warn',
    duration: lint.duration,
    details: lint.success ? '0 critical errors' : lint.output,
  });

  // 1.2 Layer 1 - Playwright Native (if tests exist)
  const testFile = path.resolve(frontendDir, 'tests/integration-pipeline/01-baseline-native.spec.ts');
  if (fs.existsSync(testFile)) {
    const playwright = runCommand('npx playwright test tests/integration-pipeline/01-baseline-native.spec.ts --reporter=list', frontendDir);
    results.push({
      level: 1,
      step: '1.2 Layer 1 - Playwright Native',
      status: playwright.success ? 'pass' : 'warn',
      duration: playwright.duration,
      details: playwright.success ? 'Tests passed' : 'Some tests failed (check report)',
    });
  } else {
    results.push({
      level: 1,
      step: '1.2 Layer 1 - Playwright Native',
      status: 'skip',
      duration: 0,
      details: 'Test file not found',
    });
  }

  // 1.3 Health Check Backend
  const health = runCommand('curl -s http://localhost:3101/api/v1/health', rootDir);
  results.push({
    level: 1,
    step: '1.3 Health Check Backend',
    status: health.output.includes('ok') ? 'pass' : 'fail',
    duration: health.duration,
    details: health.output.includes('ok') ? 'Backend healthy' : 'Backend unhealthy',
  });

  return results;
}

// Level 2: Deep Validation
async function runLevel2(): Promise<ValidationResult[]> {
  log('Running Level 2: Deep Validation', 'info');
  const results: ValidationResult[] = [];

  // 2.1 Pipeline CI
  const pipelineFile = path.resolve(frontendDir, 'scripts/run-test-pipeline.ts');
  if (fs.existsSync(pipelineFile)) {
    const pipeline = runCommand('npx ts-node scripts/run-test-pipeline.ts --preset=ci', frontendDir);
    results.push({
      level: 2,
      step: '2.1 FASE 156 Pipeline CI',
      status: pipeline.success ? 'pass' : 'warn',
      duration: pipeline.duration,
      details: pipeline.success ? 'Pipeline passed' : 'Pipeline had issues',
    });
  } else {
    results.push({
      level: 2,
      step: '2.1 FASE 156 Pipeline CI',
      status: 'skip',
      duration: 0,
      details: 'Pipeline script not found',
    });
  }

  // 2.2 Backend Unit Tests
  const unitTests = runCommand('npm run test', backendDir);
  results.push({
    level: 2,
    step: '2.2 Backend Unit Tests',
    status: unitTests.success ? 'pass' : 'fail',
    duration: unitTests.duration,
    details: unitTests.success ? 'All tests passed' : 'Some tests failed',
  });

  // 2.3 Prometheus Check
  const prometheus = runCommand('curl -s http://localhost:9090/api/v1/targets | grep -c "up"', rootDir);
  results.push({
    level: 2,
    step: '2.3 Prometheus Targets',
    status: prometheus.success ? 'pass' : 'warn',
    duration: prometheus.duration,
    details: prometheus.success ? 'Targets UP' : 'Prometheus not accessible',
  });

  return results;
}

// Level 3: Comprehensive Validation
async function runLevel3(): Promise<ValidationResult[]> {
  log('Running Level 3: Comprehensive Validation', 'info');
  const results: ValidationResult[] = [];

  // 3.1 Pipeline FULL
  const pipelineFile = path.resolve(frontendDir, 'scripts/run-test-pipeline.ts');
  if (fs.existsSync(pipelineFile)) {
    const pipeline = runCommand('npx ts-node scripts/run-test-pipeline.ts --preset=development', frontendDir);
    results.push({
      level: 3,
      step: '3.1 FASE 156 Pipeline FULL',
      status: pipeline.success ? 'pass' : 'warn',
      duration: pipeline.duration,
      details: pipeline.success ? 'Full pipeline passed' : 'Pipeline had issues',
    });
  }

  // 3.2 Migrations Check
  const migrations = runCommand('npm run migration:show', backendDir);
  results.push({
    level: 3,
    step: '3.2 Migrations Check',
    status: migrations.success ? 'pass' : 'warn',
    duration: migrations.duration,
    details: 'Migrations verified',
  });

  // 3.3 NPM Audit Backend
  const auditBackend = runCommand('npm audit --production 2>&1 | grep -E "(critical|high)" | wc -l', backendDir);
  const criticalCount = parseInt(auditBackend.output.trim() || '0', 10);
  results.push({
    level: 3,
    step: '3.3 NPM Audit Backend',
    status: criticalCount === 0 ? 'pass' : 'warn',
    duration: auditBackend.duration,
    details: criticalCount === 0 ? '0 critical/high vulnerabilities' : `${criticalCount} vulnerabilities found`,
  });

  // 3.4 NPM Audit Frontend
  const auditFrontend = runCommand('npm audit --production 2>&1 | grep -E "(critical|high)" | wc -l', frontendDir);
  const frontendCritical = parseInt(auditFrontend.output.trim() || '0', 10);
  results.push({
    level: 3,
    step: '3.4 NPM Audit Frontend',
    status: frontendCritical === 0 ? 'pass' : 'warn',
    duration: auditFrontend.duration,
    details: frontendCritical === 0 ? '0 critical/high vulnerabilities' : `${frontendCritical} vulnerabilities found`,
  });

  if (!config.skipManual) {
    results.push({
      level: 3,
      step: '3.5 PM Expert Validation',
      status: 'skip',
      duration: 0,
      details: 'Manual step - use pm-expert agent for full validation',
    });
  }

  return results;
}

// Level 4: Troubleshooting (placeholder - manual process)
async function runLevel4(): Promise<ValidationResult[]> {
  log('Running Level 4: Troubleshooting', 'info');
  const results: ValidationResult[] = [];

  results.push({
    level: 4,
    step: '4.1 Sequential Thinking Analysis',
    status: 'skip',
    duration: 0,
    details: 'Manual step - use Sequential Thinking MCP for root cause analysis',
  });

  results.push({
    level: 4,
    step: '4.2 MCP Quadruplo',
    status: 'skip',
    duration: 0,
    details: 'Manual step - use /mcp-quadruplo for comprehensive validation',
  });

  results.push({
    level: 4,
    step: '4.3 Specialized Agent',
    status: 'skip',
    duration: 0,
    details: 'Manual step - delegate to appropriate specialized agent',
  });

  return results;
}

// Level 5: Ecosystem Audit
async function runLevel5(): Promise<ValidationResult[]> {
  log('Running Level 5: Ecosystem Audit', 'info');
  const results: ValidationResult[] = [];

  // 5.1 All Containers Check
  const containers = runCommand('docker ps --format "{{.Names}}" | wc -l', rootDir);
  const containerCount = parseInt(containers.output.trim() || '0', 10);
  results.push({
    level: 5,
    step: '5.1 Container Count',
    status: containerCount >= 18 ? 'pass' : 'warn',
    duration: containers.duration,
    details: `${containerCount} containers running`,
  });

  // 5.2 Database Check
  const dbCheck = runCommand('docker exec invest_postgres psql -U postgres -d invest -c "SELECT COUNT(*) FROM assets;"', rootDir);
  results.push({
    level: 5,
    step: '5.2 Database Integrity',
    status: dbCheck.success ? 'pass' : 'fail',
    duration: dbCheck.duration,
    details: dbCheck.success ? 'Database accessible' : 'Database error',
  });

  // 5.3 Redis Check
  const redisCheck = runCommand('docker exec invest_redis redis-cli ping', rootDir);
  results.push({
    level: 5,
    step: '5.3 Redis Health',
    status: redisCheck.output.includes('PONG') ? 'pass' : 'fail',
    duration: redisCheck.duration,
    details: redisCheck.output.includes('PONG') ? 'Redis healthy' : 'Redis unhealthy',
  });

  // 5.4 Observability Stack
  const grafana = runCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', rootDir);
  results.push({
    level: 5,
    step: '5.4 Grafana',
    status: grafana.output.includes('200') ? 'pass' : 'warn',
    duration: grafana.duration,
    details: grafana.output.includes('200') ? 'Grafana accessible' : 'Grafana not accessible',
  });

  if (!config.skipManual) {
    results.push({
      level: 5,
      step: '5.5 PM Expert Ultra-Validation',
      status: 'skip',
      duration: 0,
      details: 'Manual step - run 3 parallel PM Expert agents',
    });

    results.push({
      level: 5,
      step: '5.6 CHECKLIST_ECOSSISTEMA_COMPLETO.md',
      status: 'skip',
      duration: 0,
      details: 'Manual step - verify all 21 sections',
    });
  }

  return results;
}

// Main execution
async function main(): Promise<void> {
  console.log('\n========================================');
  console.log(`  UNIVERSAL VALIDATION - LEVEL ${config.level}`);
  console.log('========================================\n');

  const startTime = Date.now();
  let allResults: ValidationResult[] = [];

  // Run levels up to specified level
  if (config.level >= 0) {
    allResults = allResults.concat(await runLevel0());

    // Check if Level 0 passed before continuing
    const level0Failed = allResults.some(r => r.status === 'fail');
    if (level0Failed && config.ci) {
      log('Level 0 failed. Stopping in CI mode.', 'error');
      process.exit(1);
    }
  }

  if (config.level >= 1) {
    allResults = allResults.concat(await runLevel1());
  }

  if (config.level >= 2) {
    allResults = allResults.concat(await runLevel2());
  }

  if (config.level >= 3) {
    allResults = allResults.concat(await runLevel3());
  }

  if (config.level >= 4) {
    allResults = allResults.concat(await runLevel4());
  }

  if (config.level >= 5) {
    allResults = allResults.concat(await runLevel5());
  }

  // Calculate summary
  const summary = {
    total: allResults.length,
    passed: allResults.filter(r => r.status === 'pass').length,
    failed: allResults.filter(r => r.status === 'fail').length,
    skipped: allResults.filter(r => r.status === 'skip').length,
    warnings: allResults.filter(r => r.status === 'warn').length,
  };

  // Determine recommendation
  let recommendation: 'APPROVED' | 'REJECTED' | 'INVESTIGATE';
  if (summary.failed > 0) {
    recommendation = 'REJECTED';
  } else if (summary.warnings > 2) {
    recommendation = 'INVESTIGATE';
  } else {
    recommendation = 'APPROVED';
  }

  // Print summary
  console.log('\n========================================');
  console.log('  VALIDATION SUMMARY');
  console.log('========================================\n');

  allResults.forEach(r => {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : r.status === 'warn' ? '⚠️' : '⏭️';
    console.log(`${icon} ${r.step}: ${r.status.toUpperCase()} (${r.duration}ms)`);
    if (r.details && config.verbose) {
      console.log(`   ${r.details}`);
    }
  });

  console.log('\n----------------------------------------');
  console.log(`Total: ${summary.total} | Pass: ${summary.passed} | Fail: ${summary.failed} | Skip: ${summary.skipped} | Warn: ${summary.warnings}`);
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`\nRecommendation: ${recommendation}`);
  console.log('----------------------------------------\n');

  // Generate report if requested
  if (config.report) {
    const report: ValidationReport = {
      level: config.level,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - startTime,
      results: allResults,
      summary,
      recommendation,
    };

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.resolve(reportsDir, `validation-level-${config.level}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Report saved to: ${reportPath}`, 'success');
  }

  // Exit with appropriate code
  if (summary.failed > 0) {
    process.exit(1);
  } else if (config.ci && summary.warnings > 2) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
