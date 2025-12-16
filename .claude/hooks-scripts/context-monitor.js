#!/usr/bin/env node
/**
 * Context Monitor v1.0
 *
 * Monitors context usage by analyzing transcript file size.
 * Triggers warnings or blocks when threshold is reached.
 *
 * Usage: Called by hooks (UserPromptSubmit, PostToolUse)
 *
 * Estimation: ~4 characters = 1 token (conservative)
 * Opus 4.5 context: 200K tokens = ~800K characters
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Opus 4.5 context window
  maxTokens: 200000,
  charsPerToken: 4,

  // Thresholds (percentage)
  warningThreshold: 40,    // Yellow warning
  compactThreshold: 50,    // Strong suggestion to compact
  blockThreshold: 70,      // Block until compact (optional)

  // Paths
  stateFile: path.join(process.cwd(), '.claude', 'context-state.json'),
  logFile: path.join(process.cwd(), '.claude', 'activity.log'),
};

// Calculate max characters
const maxChars = CONFIG.maxTokens * CONFIG.charsPerToken; // 800K chars

// Get timestamp
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// Load state
function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {}
  return {
    lastCheck: null,
    lastUsagePercent: 0,
    warningShown: false,
    compactSuggested: false,
    checksCount: 0
  };
}

// Save state
function saveState(state) {
  state.lastCheck = getTimestamp();
  state.checksCount++;
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

// Append to log
function log(message) {
  const timestamp = getTimestamp();
  fs.appendFileSync(CONFIG.logFile, `[${timestamp}] ${message}\n`);
}

// Get transcript size
function getTranscriptSize(transcriptPath) {
  try {
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      const stats = fs.statSync(transcriptPath);
      return stats.size;
    }
  } catch (e) {}
  return 0;
}

// Calculate usage percentage
function calculateUsage(transcriptSize) {
  const usagePercent = (transcriptSize / maxChars) * 100;
  return Math.min(usagePercent, 100);
}

// Create progress bar
function createProgressBar(percent) {
  const width = 20;
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percent.toFixed(1)}%`;
}

// Main function
function checkContext(inputData) {
  const state = loadState();
  const transcriptPath = inputData?.transcript_path;

  if (!transcriptPath) {
    // No transcript path available, skip check
    process.exit(0);
    return;
  }

  const transcriptSize = getTranscriptSize(transcriptPath);
  const usagePercent = calculateUsage(transcriptSize);
  const estimatedTokens = Math.round(transcriptSize / CONFIG.charsPerToken);

  state.lastUsagePercent = usagePercent;

  // Log every 10 checks
  if (state.checksCount % 10 === 0) {
    log(`[CONTEXT] Usage: ${usagePercent.toFixed(1)}% (~${estimatedTokens.toLocaleString()} tokens)`);
  }

  // Check thresholds (silent mode - only logs to file)
  if (usagePercent >= CONFIG.blockThreshold && !state.compactSuggested) {
    // CRITICAL - Block level
    log(`[CRITICAL] Context at ${usagePercent.toFixed(1)}% (~${estimatedTokens.toLocaleString()} tokens) - COMPACT URGENTE`);
    state.compactSuggested = true;
    state.warningShown = true;
    saveState(state);
    // Exit 2 to BLOCK operation until compact
    process.exit(2);

  } else if (usagePercent >= CONFIG.compactThreshold && !state.compactSuggested) {
    // COMPACT THRESHOLD - Strong suggestion (silent)
    log(`[COMPACT-NEEDED] Context at ${usagePercent.toFixed(1)}% (~${estimatedTokens.toLocaleString()} tokens) - execute /compact`);
    state.compactSuggested = true;
    state.warningShown = true;
    saveState(state);
    process.exit(0);

  } else if (usagePercent >= CONFIG.warningThreshold && !state.warningShown) {
    // WARNING THRESHOLD (silent)
    log(`[WARNING] Context at ${usagePercent.toFixed(1)}% (~${estimatedTokens.toLocaleString()} tokens)`);
    state.warningShown = true;
    saveState(state);
    process.exit(0);

  } else if (usagePercent < CONFIG.warningThreshold) {
    // Reset flags if usage dropped (after compact)
    if (state.warningShown || state.compactSuggested) {
      log(`[RESET] Context dropped to ${usagePercent.toFixed(1)}% after compact`);
      state.warningShown = false;
      state.compactSuggested = false;
    }
    saveState(state);
    process.exit(0);

  } else {
    // Between thresholds, already warned
    saveState(state);
    process.exit(0);
  }
}

// Read stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const inputData = input.trim() ? JSON.parse(input) : {};
    checkContext(inputData);
  } catch (e) {
    // Parse error, exit silently
    process.exit(0);
  }
});

// Timeout fallback
setTimeout(() => {
  process.exit(0);
}, 2000);
