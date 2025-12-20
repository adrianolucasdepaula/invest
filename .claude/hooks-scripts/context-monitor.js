#!/usr/bin/env node
/**
 * Context Monitor v2.0 - CAMADA 4
 *
 * Monitors context usage by reading REAL tokens from transcript.
 * Triggers warnings or blocks when threshold is reached.
 *
 * Usage: Called by hooks (UserPromptSubmit, PostToolUse)
 *
 * MUDANCA v2.0:
 * - Usa token-reader.js para ler tokens REAIS do transcript
 * - NAO usa mais tamanho em bytes (estava ERRADO - transcript e append-only)
 *
 * FONTES:
 * - https://codelynx.dev/posts/calculate-claude-code-context
 * - https://github.com/anthropics/claude-code/issues/6577
 */

const fs = require('fs');
const path = require('path');

// Importar token-reader (calculo CORRETO de tokens)
const { getContextUsage } = require('./token-reader');

// Configuration - Thresholds baseados em TOKENS REAIS
const CONFIG = {
  // Sonnet 4.5 context window (1M beta)
  maxTokens: 1000000,

  // Thresholds (percentage) - Baseados em tokens REAIS, nao mais em bytes
  warningThreshold: 50,    // Warning em 50%
  compactThreshold: 70,    // Sugerir compact em 70%
  blockThreshold: 85,      // Bloquear em 85%

  // Paths
  stateFile: path.join(process.cwd(), '.claude', 'context-state.json'),
  logFile: path.join(process.cwd(), '.claude', 'activity.log'),
};

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

// REMOVIDO: getTranscriptSize() e calculateUsage()
// Agora usamos getContextUsage() do token-reader.js que le tokens REAIS

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

  // Usar tokens REAIS do transcript
  const usage = getContextUsage(transcriptPath);
  const usagePercent = usage.percent;
  const tokens = usage.tokens;
  const remainingTokens = CONFIG.maxTokens - tokens;

  state.lastUsagePercent = usagePercent;

  // Log every 10 checks
  if (state.checksCount % 10 === 0) {
    log(`[CONTEXT] Usage: ${usagePercent.toFixed(1)}% (${tokens.toLocaleString()} tokens REAIS)`);
  }

  // Check thresholds - mensagens via stderr para Claude
  if (usagePercent >= CONFIG.blockThreshold && !state.compactSuggested) {
    // CRITICAL - Block level (85%+)
    log(`[CRITICAL] Context at ${usagePercent.toFixed(1)}% (${tokens.toLocaleString()} tokens) - COMPACT URGENTE`);
    state.compactSuggested = true;
    state.warningShown = true;
    saveState(state);

    // Exit 2 = BLOQUEIA e envia mensagem ao Claude via stderr
    console.error(`CONTEXTO CRITICO: ${usagePercent.toFixed(1)}% (${tokens.toLocaleString()} tokens)

ACAO OBRIGATORIA: Execute /compact AGORA para continuar.

Motivo: Contexto acima de 85% - risco iminente de "Prompt is too long".
        Tokens restantes: ${remainingTokens.toLocaleString()}`);

    process.exit(2);

  } else if (usagePercent >= CONFIG.compactThreshold && !state.compactSuggested) {
    // COMPACT THRESHOLD (70%+) - Strong suggestion (silent)
    log(`[COMPACT-NEEDED] Context at ${usagePercent.toFixed(1)}% (${tokens.toLocaleString()} tokens) - execute /compact`);
    state.compactSuggested = true;
    state.warningShown = true;
    saveState(state);
    process.exit(0);

  } else if (usagePercent >= CONFIG.warningThreshold && !state.warningShown) {
    // WARNING THRESHOLD (50%+) (silent)
    log(`[WARNING] Context at ${usagePercent.toFixed(1)}% (${tokens.toLocaleString()} tokens)`);
    state.warningShown = true;
    saveState(state);
    process.exit(0);

  } else if (usagePercent < CONFIG.warningThreshold) {
    // Reset flags if usage dropped (after compact)
    if (state.warningShown || state.compactSuggested) {
      log(`[RESET] Context dropped to ${usagePercent.toFixed(1)}% (${tokens.toLocaleString()} tokens) after compact`);
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
