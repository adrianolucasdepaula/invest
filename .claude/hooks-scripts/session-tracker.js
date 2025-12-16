#!/usr/bin/env node
/**
 * Session Tracker Hook Script v4.0
 *
 * SINCRONIZAÇÃO BIDIRECIONAL:
 * 1. Lê transcript nativo do Claude Code
 * 2. Detecta plano ativo em ~/.claude/plans/
 * 3. ATUALIZA checkpoint DENTRO do arquivo de planejamento
 * 4. Mantém session-metrics.json sincronizado
 *
 * Objetivo: Evitar "Prompt is too long" com rastreamento completo
 * para retomada em nova sessão.
 *
 * Eventos tracked:
 * - pre-compact: Antes de compact (sincroniza checkpoint)
 * - stop: Quando sessão termina
 * - start: Início de sessão
 * - sync: Sincronização manual
 *
 * Logs salvos em:
 * - .claude/session-metrics.json (métricas agregadas + planPath)
 * - .claude/activity.log (eventos importantes)
 * - ~/.claude/plans/<plano>.md (checkpoint atualizado no próprio plano)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const LOG_DIR = path.join(process.cwd(), '.claude');
const ACTIVITY_LOG = path.join(LOG_DIR, 'activity.log');
const METRICS_FILE = path.join(LOG_DIR, 'session-metrics.json');
const CONTEXT_STATE_FILE = path.join(LOG_DIR, 'context-state.json');

// Plans directory (Claude Code stores plans in user's .claude/plans/)
const PLANS_DIR = path.join(os.homedir(), '.claude', 'plans');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Get timestamp
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// Get date string
function getDateString() {
  return new Date().toISOString().substring(0, 10);
}

// Load or initialize metrics
function loadMetrics() {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    sessionStart: getTimestamp(),
    interactions: 0,
    autoCompacts: 0,
    manualCompacts: 0,
    lastCompact: null,
    lastActivity: null,
    transcriptPath: null,
    sessionId: null,
    planPath: null,
    planName: null,
    planLastModified: null,
    planTitle: null,
    planCurrentPhase: null,
    lastCheckpointSync: null
  };
}

// Save metrics
function saveMetrics(metrics) {
  metrics.lastActivity = getTimestamp();
  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
}

// Reset context state after compact
function resetContextState() {
  const resetState = {
    lastCheck: getTimestamp(),
    lastUsagePercent: 0,
    warningShown: false,
    compactSuggested: false,
    checksCount: 0
  };
  fs.writeFileSync(CONTEXT_STATE_FILE, JSON.stringify(resetState, null, 2));
}

// Append to activity log (minimal, only important events)
function logActivity(message) {
  const timestamp = getTimestamp();
  fs.appendFileSync(ACTIVITY_LOG, `[${timestamp}] ${message}\n`);
}

// Extract session info from transcript path
function extractSessionInfo(transcriptPath) {
  if (!transcriptPath) return null;

  const parts = transcriptPath.split(path.sep);
  const sessionFile = parts[parts.length - 1];
  const sessionId = sessionFile.replace('.jsonl', '');

  return {
    sessionId,
    transcriptPath,
    transcriptSize: fs.existsSync(transcriptPath) ? fs.statSync(transcriptPath).size : 0
  };
}

/**
 * Detect active plan file from ~/.claude/plans/
 */
function detectActivePlan() {
  if (!fs.existsSync(PLANS_DIR)) {
    return null;
  }

  try {
    const files = fs.readdirSync(PLANS_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const fullPath = path.join(PLANS_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          name: f,
          path: fullPath,
          mtime: stats.mtime.getTime(),
          mtimeStr: stats.mtime.toISOString().replace('T', ' ').substring(0, 19)
        };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      return null;
    }

    const activePlan = files[0];
    return {
      planPath: activePlan.path,
      planName: activePlan.name,
      planLastModified: activePlan.mtimeStr
    };
  } catch (e) {
    return null;
  }
}

/**
 * Extract plan summary from the first 100 lines
 */
function extractPlanSummary(planPath) {
  if (!planPath || !fs.existsSync(planPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(planPath, 'utf8');
    const lines = content.split('\n').slice(0, 100);

    let summary = {
      title: null,
      version: null,
      objective: null,
      currentPhase: null,
      currentStatus: null,
      interactionCount: 0
    };

    for (const line of lines) {
      if (!summary.title && line.startsWith('# ')) {
        summary.title = line.replace('# ', '').trim().substring(0, 100);
      }
      if (line.includes('**Versao:**') || line.includes('**Version:**')) {
        const match = line.match(/\*\*Vers[aã]o:\*\*\s*(.+)/i);
        if (match) summary.version = match[1].trim();
      }
      if (line.includes('<!-- Phase:')) {
        const match = line.match(/<!-- Phase:\s*(.+?)\s*-->/);
        if (match) summary.currentPhase = match[1].trim();
      }
      if (line.includes('<!-- Status:')) {
        const match = line.match(/<!-- Status:\s*(.+?)\s*-->/);
        if (match) summary.currentStatus = match[1].trim();
      }
      if (line.includes('| **Interacao Atual**')) {
        const match = line.match(/\|\s*#?(\d+)\s*\|/);
        if (match) summary.interactionCount = parseInt(match[1], 10);
      }
      if (line.includes('Fase em Execucao')) {
        const match = line.match(/\|\s*(.+?)\s*\|$/);
        if (match && !summary.currentPhase) summary.currentPhase = match[1].trim();
      }
    }

    return summary;
  } catch (e) {
    return null;
  }
}

/**
 * SINCRONIZAÇÃO BIDIRECIONAL: Atualiza checkpoint dentro do arquivo de planejamento
 */
function syncCheckpointToPlan(planPath, metrics) {
  if (!planPath || !fs.existsSync(planPath)) {
    return false;
  }

  try {
    let content = fs.readFileSync(planPath, 'utf8');
    const timestamp = getTimestamp();
    const dateStr = getDateString();
    const interactionCount = (metrics.interactions || 0) + 1;

    // Prepare checkpoint data
    const checkpointData = {
      lastUpdate: dateStr,
      phase: metrics.planCurrentPhase || 'unknown',
      status: 'in_progress',
      sessionId: metrics.sessionId || 'unknown',
      transcriptPath: metrics.transcriptPath || 'unknown',
      interaction: interactionCount,
      lastSync: timestamp
    };

    // Update HTML comment checkpoint markers
    content = content.replace(
      /<!-- Last Update: .+? -->/,
      `<!-- Last Update: ${dateStr} -->`
    );
    content = content.replace(
      /<!-- Status: .+? -->/,
      `<!-- Status: ${checkpointData.status} -->`
    );

    // Update table checkpoint if exists
    const tableCheckpointRegex = /(\| \*\*Sessao Atual\*\* \|).+(\|)/;
    if (tableCheckpointRegex.test(content)) {
      content = content.replace(tableCheckpointRegex, `$1 ${dateStr} $2`);
    }

    const interactionRegex = /(\| \*\*Interacao Atual\*\* \|).+(\|)/;
    if (interactionRegex.test(content)) {
      content = content.replace(interactionRegex, `$1 #${interactionCount} $2`);
    }

    // Add sync timestamp if pattern exists
    const syncRegex = /(\| \*\*Ultima Sincronizacao\*\* \|).+(\|)/;
    if (syncRegex.test(content)) {
      content = content.replace(syncRegex, `$1 ${timestamp} $2`);
    }

    // Write back to plan
    fs.writeFileSync(planPath, content, 'utf8');

    return true;
  } catch (e) {
    logActivity(`[SYNC-ERROR] Failed to sync checkpoint to plan: ${e.message}`);
    return false;
  }
}

/**
 * Get recent transcript messages for context recovery
 */
function getRecentMessages(transcriptPath, count = 5) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];

  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    const lastLines = lines.slice(-count * 3);

    const messages = [];
    for (const line of lastLines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'user' || entry.type === 'assistant') {
          messages.push({
            type: entry.type,
            timestamp: entry.timestamp,
            preview: entry.message?.content?.substring(0, 150) || '[tool use]'
          });
        }
      } catch (e) {}
    }

    return messages.slice(-count);
  } catch (e) {
    return [];
  }
}

/**
 * Count messages in transcript
 */
function countTranscriptMessages(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return 0;

  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    let count = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'user') count++;
      } catch (e) {}
    }
    return count;
  } catch (e) {
    return 0;
  }
}

// Main event handler
function handleEvent(eventType, inputData) {
  const metrics = loadMetrics();
  const transcriptPath = inputData?.transcript_path;

  // Update transcript path reference
  if (transcriptPath) {
    metrics.transcriptPath = transcriptPath;
    const sessionInfo = extractSessionInfo(transcriptPath);
    if (sessionInfo) {
      metrics.sessionId = sessionInfo.sessionId;
    }
    // Count interactions from transcript
    metrics.interactions = countTranscriptMessages(transcriptPath);
  }

  // Detect and update active plan
  const activePlan = detectActivePlan();
  if (activePlan) {
    const planChanged = metrics.planPath !== activePlan.planPath;

    metrics.planPath = activePlan.planPath;
    metrics.planName = activePlan.planName;
    metrics.planLastModified = activePlan.planLastModified;

    const planSummary = extractPlanSummary(activePlan.planPath);
    if (planSummary) {
      metrics.planTitle = planSummary.title;
      metrics.planCurrentPhase = planSummary.currentPhase;
    }

    if (planChanged) {
      logActivity(`[PLAN-DETECTED] ${activePlan.planName}`);
      if (planSummary?.title) {
        logActivity(`[PLAN-TITLE] ${planSummary.title}`);
      }
    }
  }

  switch (eventType) {
    case 'pre-compact':
      const trigger = inputData?.trigger || 'manual';
      if (trigger === 'auto') {
        metrics.autoCompacts++;
        logActivity(`[AUTO-COMPACT] #${metrics.autoCompacts}`);
      } else {
        metrics.manualCompacts++;
        logActivity(`[MANUAL-COMPACT] #${metrics.manualCompacts}`);
      }
      metrics.lastCompact = getTimestamp();

      // SYNC checkpoint to plan before compact
      if (metrics.planPath) {
        const synced = syncCheckpointToPlan(metrics.planPath, metrics);
        if (synced) {
          metrics.lastCheckpointSync = getTimestamp();
          logActivity(`[CHECKPOINT-SYNC] ${metrics.planName} - Phase: ${metrics.planCurrentPhase || 'unknown'} - Interaction: #${metrics.interactions}`);
        }
      }

      resetContextState();

      // Log recent messages for recovery
      if (transcriptPath) {
        const recentMessages = getRecentMessages(transcriptPath, 5);
        if (recentMessages.length > 0) {
          logActivity(`[CONTEXT-SNAPSHOT] Last ${recentMessages.length} messages saved`);
        }
      }
      break;

    case 'stop':
      // SYNC checkpoint to plan on stop
      if (metrics.planPath) {
        const synced = syncCheckpointToPlan(metrics.planPath, metrics);
        if (synced) {
          metrics.lastCheckpointSync = getTimestamp();
          logActivity(`[CHECKPOINT-SYNC] Final sync to ${metrics.planName}`);
        }
      }

      logActivity(`[SESSION-END] Interactions: ${metrics.interactions}, Compacts: ${metrics.autoCompacts + metrics.manualCompacts}`);
      logActivity(`[TRANSCRIPT] ${metrics.transcriptPath || 'not tracked'}`);
      if (metrics.planPath) {
        logActivity(`[PLAN-FINAL] ${metrics.planName}`);
      }
      break;

    case 'start':
      metrics.sessionStart = getTimestamp();
      logActivity(`[SESSION-START] New session initialized`);
      if (transcriptPath) {
        logActivity(`[TRANSCRIPT] ${transcriptPath}`);
      }
      if (metrics.planPath) {
        logActivity(`[PLAN-LOADED] ${metrics.planName}`);
      }
      break;

    case 'sync':
      // Manual sync request
      if (metrics.planPath) {
        const synced = syncCheckpointToPlan(metrics.planPath, metrics);
        if (synced) {
          metrics.lastCheckpointSync = getTimestamp();
          logActivity(`[MANUAL-SYNC] Checkpoint synced to ${metrics.planName}`);
        }
      }
      break;

    default:
      if (eventType) {
        logActivity(`[EVENT] ${eventType}`);
      }
  }

  saveMetrics(metrics);
}

// Read input from stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const eventType = process.argv[2] || 'unknown';
    let inputData = {};

    if (input.trim()) {
      try {
        inputData = JSON.parse(input);
      } catch (e) {}
    }

    handleEvent(eventType, inputData);
    process.exit(0);
  } catch (error) {
    logActivity(`[ERROR] ${error.message}`);
    process.exit(0);
  }
});

process.stdin.on('error', () => {
  const eventType = process.argv[2] || 'unknown';
  handleEvent(eventType, {});
  process.exit(0);
});

setTimeout(() => {
  const eventType = process.argv[2] || 'unknown';
  handleEvent(eventType, {});
  process.exit(0);
}, 1000);
