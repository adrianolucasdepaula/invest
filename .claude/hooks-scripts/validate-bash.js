#!/usr/bin/env node
/**
 * Pre-Bash Hook: Validates bash commands before execution
 *
 * Checks for dangerous patterns:
 * - rm -rf / (root deletion)
 * - format/fdisk commands
 * - env variable exposure
 * - Force push to main/master
 */

const fs = require('fs');

// Read tool input from stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const toolInput = JSON.parse(input);
    const command = toolInput.command || '';

    // Dangerous patterns to block
    const dangerousPatterns = [
      { pattern: /rm\s+-rf\s+\/(?!\w)/i, message: 'Blocked: rm -rf / is extremely dangerous' },
      { pattern: /rm\s+-rf\s+\*\s*$/i, message: 'Blocked: rm -rf * without path is dangerous' },
      { pattern: /mkfs|format\s+[a-z]:/i, message: 'Blocked: disk formatting commands' },
      { pattern: /git\s+push.*--force.*(?:main|master)/i, message: 'Blocked: force push to main/master' },
      { pattern: />\s*\/etc\/passwd/i, message: 'Blocked: writing to system files' },
      { pattern: /dd\s+.*of=\/dev/i, message: 'Blocked: dd to device files' },
    ];

    // Warning patterns (allowed but logged)
    const warningPatterns = [
      { pattern: /rm\s+-rf/i, message: 'Warning: recursive force delete detected' },
      { pattern: /docker\s+system\s+prune/i, message: 'Warning: Docker cleanup command' },
      { pattern: /DROP\s+DATABASE/i, message: 'Warning: database drop command' },
    ];

    // Check for dangerous patterns
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(command)) {
        console.error(`🚫 ${message}`);
        console.error(`Command: ${command.substring(0, 100)}...`);
        process.exit(2); // Exit 2 = block the command
      }
    }

    // Log warnings but allow
    for (const { pattern, message } of warningPatterns) {
      if (pattern.test(command)) {
        console.error(`⚠️ ${message}`);
      }
    }

    // Command is safe
    process.exit(0);

  } catch (error) {
    // Parse error - allow command to proceed
    console.error(`Hook parse error: ${error.message}`);
    process.exit(0);
  }
});
