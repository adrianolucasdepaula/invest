#!/usr/bin/env node
/**
 * Response Validator Hook v1.0
 *
 * Verifica qualidade da resposta do Claude antes de permitir parar.
 * Dispara no evento Stop para garantir que tarefas foram completadas.
 *
 * Mitigacoes implementadas:
 * - Loop infinito: Max 2 bloqueios consecutivos
 * - Latencia: Timeout 5s + skip para respostas curtas
 * - Falsos positivos: Detectar perguntas, ofertas de ajuda
 * - Overhead: Mensagens curtas
 *
 * Referencia: PLANO lively-foraging-moonbeam.md
 */

const fs = require('fs');
const path = require('path');

// Paths
const STATE_FILE = path.join(process.cwd(), '.claude', 'validator-state.json');
const LOG_FILE = path.join(process.cwd(), '.claude', 'activity.log');

// Configuration
const CONFIG = {
  maxConsecutiveBlocks: 2,    // Prevenir loop infinito
  skipMinLength: 500,         // Skip respostas curtas
  timeout: 5000,              // Timeout em ms
  maxReasonLength: 200        // Limite de caracteres na razao
};

// Padroes que indicam PROBLEMA (deve bloquear)
const PROBLEM_PATTERNS = [
  {
    pattern: /error TS\d+:/i,
    reason: 'Erros TypeScript detectados',
    action: 'Execute npx tsc --noEmit e corrija os erros'
  },
  {
    pattern: /npm ERR!/i,
    reason: 'Erro npm detectado',
    action: 'Verifique o erro e corrija'
  },
  {
    pattern: /Build failed/i,
    reason: 'Build falhou',
    action: 'Corrija os erros de build'
  },
  {
    pattern: /ENOENT|EACCES|EPERM/i,
    reason: 'Erro de sistema de arquivos',
    action: 'Verifique permissoes e caminhos'
  },
  {
    pattern: /\/\/ TODO:?\s*\w+/i,
    reason: 'Codigo com TODO pendente',
    action: 'Complete o TODO antes de finalizar'
  },
  {
    pattern: /\.\.\.\s*```\s*$/m,
    reason: 'Codigo parece truncado',
    action: 'Complete o bloco de codigo'
  }
];

// Padroes que indicam CONCLUSAO VALIDA (deve permitir)
const COMPLETION_PATTERNS = [
  /implementa(do|da|cao)\s+(com\s+)?sucesso/i,
  /tarefa\s+(foi\s+)?(conclu[ií]da|completada|finalizada)/i,
  /zero\s+tolerance\s*(validado|ok|passou)/i,
  /build\s+(completado|sucesso|passou)/i,
  /tsc.*0\s*erros?/i,
  /0\s+erros?\s+typescript/i,
  /valida[çc][aã]o\s+(passou|ok|sucesso)/i,
  /commit\s+realizado/i,
  /arquivos?\s+modificados?\s+com\s+sucesso/i
];

// Padroes de resposta INFORMATIVA (NAO bloquear)
const INFORMATIVE_PATTERNS = [
  /\?\s*$/m,                              // Termina com pergunta
  /quer\s+que\s+eu/i,                     // Oferecendo ajuda
  /posso\s+(ajudar|explicar|continuar)/i, // Oferecendo opcoes
  /aguardando\s+(suas?\s+)?instru[çc]/i,  // Esperando input
  /o\s+que\s+(voce\s+)?(acha|prefere)/i,  // Pedindo opiniao
  /alguma\s+(duvida|pergunta)/i,          // Verificando duvidas
  /precisa\s+de\s+mais/i,                 // Oferecendo mais info
  /gostaria\s+que\s+eu/i                  // Oferecendo servico
];

// Padroes de SKIP (nao verificar)
const SKIP_PATTERNS = [
  /^(sim|nao|ok|entendi|certo|perfeito)\.?$/i,  // Respostas curtas
  /resumo\s+(da\s+)?implementa[çc][aã]o/i,       // Resumos
  /plano\s+(foi\s+)?aprovado/i                   // Confirmacao de plano
];

// Get timestamp
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// Log to activity file
function log(message) {
  try {
    fs.appendFileSync(LOG_FILE, `[${getTimestamp()}] [VALIDATOR] ${message}\n`);
  } catch (e) {}
}

// Load state
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    consecutiveBlocks: 0,
    lastBlockReason: null,
    lastCheck: null,
    totalChecks: 0,
    totalBlocks: 0,
    totalAllows: 0
  };
}

// Save state
function saveState(state) {
  state.lastCheck = getTimestamp();
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

// Extract last assistant response from transcript
function getLastResponse(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return '';
  }

  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n');

    // Procurar de tras pra frente pela ultima resposta do assistant
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === 'assistant') {
          // Extrair conteudo textual
          if (typeof entry.message?.content === 'string') {
            return entry.message.content;
          }
          // Se for array de content blocks
          if (Array.isArray(entry.message?.content)) {
            return entry.message.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join('\n');
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    log(`Error reading transcript: ${e.message}`);
  }

  return '';
}

// Check if should skip validation
function shouldSkip(response, inputData) {
  // Skip se resposta muito curta
  if (response.length < CONFIG.skipMinLength) {
    return { skip: true, reason: 'Resposta curta' };
  }

  // Skip se usuario interrompeu
  if (inputData?.stop_reason === 'interrupt') {
    return { skip: true, reason: 'Usuario interrompeu' };
  }

  // Skip se nao tem codigo
  if (!response.includes('```')) {
    return { skip: true, reason: 'Sem blocos de codigo' };
  }

  // Skip patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(response)) {
      return { skip: true, reason: 'Pattern de skip detectado' };
    }
  }

  return { skip: false };
}

// Main validation function
function validateResponse(inputData) {
  const state = loadState();
  state.totalChecks++;

  const transcriptPath = inputData?.transcript_path;
  const lastResponse = getLastResponse(transcriptPath);

  // Verificar skip conditions
  const skipCheck = shouldSkip(lastResponse, inputData);
  if (skipCheck.skip) {
    state.consecutiveBlocks = 0;
    state.totalAllows++;
    saveState(state);
    return { decision: 'allow', reason: skipCheck.reason };
  }

  // Verificar padroes informativos (NAO bloquear)
  for (const pattern of INFORMATIVE_PATTERNS) {
    if (pattern.test(lastResponse)) {
      state.consecutiveBlocks = 0;
      state.totalAllows++;
      saveState(state);
      return { decision: 'allow', reason: 'Resposta informativa' };
    }
  }

  // Verificar padroes de conclusao (NAO bloquear)
  for (const pattern of COMPLETION_PATTERNS) {
    if (pattern.test(lastResponse)) {
      state.consecutiveBlocks = 0;
      state.totalAllows++;
      saveState(state);
      log(`Conclusao detectada: ${pattern.toString().substring(0, 50)}`);
      return { decision: 'allow', reason: 'Tarefa concluida' };
    }
  }

  // Verificar padroes de problema (BLOQUEAR)
  for (const { pattern, reason, action } of PROBLEM_PATTERNS) {
    if (pattern.test(lastResponse)) {
      state.consecutiveBlocks++;
      state.totalBlocks++;

      // Limite de bloqueios consecutivos (prevenir loop)
      if (state.consecutiveBlocks >= CONFIG.maxConsecutiveBlocks) {
        log(`Max retries atingido (${CONFIG.maxConsecutiveBlocks}). Allowing.`);
        state.consecutiveBlocks = 0;
        state.lastBlockReason = null;
        state.totalAllows++;
        saveState(state);
        return {
          decision: 'allow',
          reason: `Max retries atingido. ${reason} ainda presente.`
        };
      }

      const fullReason = `${reason}. ${action}`.substring(0, CONFIG.maxReasonLength);
      state.lastBlockReason = reason;
      saveState(state);
      log(`BLOCK #${state.consecutiveBlocks}: ${reason}`);

      return {
        decision: 'block',
        reason: fullReason
      };
    }
  }

  // Nenhum problema detectado
  state.consecutiveBlocks = 0;
  state.totalAllows++;
  saveState(state);
  return { decision: 'allow', reason: 'OK' };
}

// Output result as JSON
// ✅ FIX: Stop hooks não usam "decision" e "reason" - schema diferente de PreToolUse
// Para Stop hooks, schema válido: {continue?, suppressOutput?, stopReason?, systemMessage?}
function outputResult(result) {
  // Converter schema PreToolUse para Stop hook
  const stopHookResult = {
    // Stop hooks não tem "decision" - apenas retornar vazio ou systemMessage
    suppressOutput: false
  };

  // Opcional: adicionar systemMessage se houver informação relevante
  if (result.decision === 'block') {
    stopHookResult.systemMessage = `⚠️ Response validator: ${result.reason}`;
  }

  console.log(JSON.stringify(stopHookResult));
}

// Main execution
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const inputData = input.trim() ? JSON.parse(input) : {};
    const result = validateResponse(inputData);
    outputResult(result);
    process.exit(0);
  } catch (e) {
    log(`Parse error: ${e.message}`);
    outputResult({ decision: 'allow', reason: 'Parse error' });
    process.exit(0);
  }
});

process.stdin.on('error', () => {
  outputResult({ decision: 'allow', reason: 'Stdin error' });
  process.exit(0);
});

// Timeout fallback
setTimeout(() => {
  log('Timeout reached');
  outputResult({ decision: 'allow', reason: 'Timeout' });
  process.exit(0);
}, CONFIG.timeout);
