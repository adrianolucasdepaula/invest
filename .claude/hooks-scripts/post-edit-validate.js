#!/usr/bin/env node
/**
 * Post-Edit Hook: Validates TypeScript after file edits
 *
 * Runs TypeScript validation for:
 * - .ts files in backend/
 * - .ts/.tsx files in frontend/
 *
 * Reports errors but doesn't block (informational)
 */

const { execSync } = require('child_process');
const path = require('path');

// Read tool input from stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const toolInput = JSON.parse(input);
    const filePath = toolInput.file_path || '';

    // Only validate TypeScript files
    if (!filePath.match(/\.(ts|tsx)$/)) {
      process.exit(0);
    }

    // Determine which project to validate
    const normalizedPath = filePath.replace(/\\/g, '/');
    let projectPath = '';
    let projectName = '';

    if (normalizedPath.includes('/backend/')) {
      projectPath = path.join(process.cwd(), 'backend');
      projectName = 'Backend';
    } else if (normalizedPath.includes('/frontend/')) {
      projectPath = path.join(process.cwd(), 'frontend');
      projectName = 'Frontend';
    } else {
      // Not in known project directories
      process.exit(0);
    }

    // Run TypeScript check (non-blocking)
    try {
      execSync('npx tsc --noEmit', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 30000, // 30 second timeout
      });
      console.log(`✅ ${projectName} TypeScript: 0 errors`);
    } catch (error) {
      // TypeScript errors found
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorCount = (output.match(/error TS/g) || []).length;

      if (errorCount > 0) {
        console.log(`⚠️ ${projectName} TypeScript: ${errorCount} error(s) found`);
        console.log('Run `npx tsc --noEmit` to see details');
      }
    }

    process.exit(0);

  } catch (error) {
    // Parse error - continue silently
    process.exit(0);
  }
});
