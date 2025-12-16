#!/usr/bin/env node
/**
 * Session Start Hook v4.0
 *
 * Executa ao iniciar nova sessao Claude Code.
 * Exibe banner com sistema de automacao ativo.
 *
 * Referencia: CHECKLIST_ECOSSISTEMA_COMPLETO.md (22 secoes)
 *
 * v4.0 (2025-12-15): 65 categorias (100% cobertura CHECKLIST)
 *   - 11 novas domain-specific: technicalIndicators, fundamentalMetrics,
 *     macro, corporateActions, wheelStrategy, sentiment, riskManagement,
 *     marketIndices, dataSources, cicd, dataQuality
 *   - ~1100 keywords bilingues (PT + EN)
 *   - 22/22 secoes cobertas
 * v3.0 (2025-12-15): 51 categorias (adicionadas 17 novas v4.0)
 * v2.0 (2025-12-15): 34 categorias (adicionadas 10 novas v3.0)
 * v1.0 (2025-12-15): 27 categorias iniciais
 */

const fs = require('fs');
const path = require('path');

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function logSession() {
  const logFile = path.join(process.cwd(), '.claude', 'activity.log');
  const timestamp = getTimestamp();
  try {
    fs.appendFileSync(logFile, `[${timestamp}] [SESSION-START] Nova sessao iniciada\n`);
  } catch (e) {
    // Ignore logging errors
  }
}

function main() {
  logSession();

  console.log('');
  console.log('='.repeat(78));
  console.log('  B3 AI ANALYSIS PLATFORM - CHECKLIST AUTOMATICO ATIVO (65 CATEGORIAS)');
  console.log('='.repeat(78));
  console.log('');
  console.log('  Documentos: CLAUDE.md + CHECKLIST_ECOSSISTEMA_COMPLETO.md (22 secoes)');
  console.log('');
  console.log('  Keywords detectadas automaticamente (PT + EN):');
  console.log('  ' + '-'.repeat(74));
  console.log('  | CATEGORIA         | KEYWORDS (exemplos)                | SECOES      |');
  console.log('  ' + '-'.repeat(74));
  console.log('  | planning          | planejamento, pm, robusto, ultra   | 1-2, IMPL   |');
  console.log('  | development       | implementar, criar, feature, add   | 1-3         |');
  console.log('  | codeReview        | revisar, best practices, refactor  | 3-4         |');
  console.log('  | commit            | commit, push, merge, git, branch   | 4-5         |');
  console.log('  | phase             | fase, etapa, validar, ecosystem    | 6-21        |');
  console.log('  | scraper           | scraper, playwright, fontes, dados | 18          |');
  console.log('  | frontend          | frontend, react, pagina, component | 3.2, 8.1    |');
  console.log('  | ux                | usabilidade, acessibilidade, wcag  | 6, a11y     |');
  console.log('  | forms             | formulario, input, button, field   | 3.2, 8.1    |');
  console.log('  | visual            | layout, style, imagem, scroll      | 3.2, DevT   |');
  console.log('  | charts            | grafico, tabela, ordenacao, lista  | 8.1, 3.2    |');
  console.log('  | backend           | backend, controller, service, dto  | 3.1, 8.2    |');
  console.log('  | database          | database, migration, entity, sql   | 17, DB_SCH  |');
  console.log('  | financial         | financeiro, decimal, preco, ativo  | 3.1, fin    |');
  console.log('  | troubleshoot      | erro, bug, fix, root cause         | 7, KNOWN    |');
  console.log('  | quality           | gap, warning, falha, workaround    | 7, 12       |');
  console.log('  | security          | auth, oauth, jwt, vulnerabilidade  | 16          |');
  console.log('  | docker            | docker, container, porta, restart  | 19, 8.3     |');
  console.log('  | api               | api, integracao, dependencia       | 20, 11.3    |');
  console.log('  | testing           | teste, cenario, coverage, massivo  | 13, 6       |');
  console.log('  | performance       | performance, cache, paralelo       | 15, 3       |');
  console.log('  | observability     | log, trace, monitoracao, auditoria | 10, 5       |');
  console.log('  | jobs              | job, queue, agendamento, sync      | 11.2, 15    |');
  console.log('  | websocket         | websocket, realtime, evento        | 11.1, 15    |');
  console.log('  | documentation     | documentacao, readme, architecture | 1, INDEX    |');
  console.log('  | mcp               | mcp, triplo, devtools, skill       | 21, METOD   |');
  console.log('  | environment       | timezone, config, versao, env      | 1, 19       |');
  console.log('  ' + '-'.repeat(74));
  console.log('  | === NOVAS v3.0 === |                                    |             |');
  console.log('  ' + '-'.repeat(74));
  console.log('  | webResearch       | pesquisar, best practices, how to  | 22, BEST    |');
  console.log('  | postImplementation| done, complete, finished, ready    | 6, 8, 9     |');
  console.log('  | regression        | quebrou, broken, nao funciona      | 7, 13       |');
  console.log('  | docSync           | sync docs, claude.md, gemini.md    | 1, 5        |');
  console.log('  | testCoverage      | coverage, test gap, falta teste    | 13, 6       |');
  console.log('  | deployment        | deploy, production, release        | 6, 19       |');
  console.log('  | ecosystem         | ecossistema, full validation, 100% | 6-21        |');
  console.log('  | agentHelp         | need help, especialista, complexo  | 21, AGENTS  |');
  console.log('  | improvement       | melhorar, evoluir, otimizar        | 15, 3       |');
  console.log('  | urgency           | urgente, critico, emergency        | 7, KNOWN    |');
  console.log('  ' + '-'.repeat(74));
  console.log('  | === NOVAS v4.0 === |                                    |             |');
  console.log('  ' + '-'.repeat(74));
  console.log('  | migration         | migracao, rollback, seed, schema   | 17, 5       |');
  console.log('  | validation        | validacao, dto, schema, constraint | 3, 7        |');
  console.log('  | routing           | rota, navegacao, layout, param     | 3.2, 8.1    |');
  console.log('  | hook              | hook, useEffect, useState, custom  | 3.2, 8.1    |');
  console.log('  | middleware        | middleware, interceptor, guard     | 3.1, 8.2    |');
  console.log('  | transaction       | transacao, atomic, acid, rollback  | 17          |');
  console.log('  | index             | indice, n+1, slow query, explain   | 17, 15      |');
  console.log('  | cache             | cache, redis, ttl, invalidacao     | 15, 11      |');
  console.log('  | crossvalidation   | validacao cruzada, consenso, fonte | 11.3, 20    |');
  console.log('  | dividend          | dividendo, provento, jcp, yield    | 14, 8.1     |');
  console.log('  | options           | opcao, greeks, strike, vencimento  | 18, 20      |');
  console.log('  | health            | saude, health check, probe, status | 14, 19      |');
  console.log('  | network           | rede, dns, porta, conectividade    | 19, 8.3     |');
  console.log('  | backup            | backup, recovery, dump, restore    | 17, 19      |');
  console.log('  | retry             | tentativa, backoff, reconectar     | 7, 18       |');
  console.log('  | ratelimit         | limite taxa, quota, throttle, 429  | 20, 12      |');
  console.log('  | circuit           | circuit breaker, fallback, resil.  | 11.3, 20    |');
  console.log('  ' + '-'.repeat(74));
  console.log('  | === NOVAS v5.0 (Domain-Specific) ===                                    |');
  console.log('  ' + '-'.repeat(74));
  console.log('  | technicalIndic.   | RSI, MACD, Bollinger, SMA, EMA     | 18, 20      |');
  console.log('  | fundamentalMetr.  | P/L, ROE, EBITDA, EPS, margin      | 14, 3.1     |');
  console.log('  | macro             | SELIC, PIB, cambio, inflacao       | 20, econ    |');
  console.log('  | corporateActions  | split, grupamento, fusao, OPA      | 14, 17      |');
  console.log('  | wheelStrategy     | covered call, premium, assignment  | 18, 8.1     |');
  console.log('  | sentiment         | bullish, bearish, news, rating     | 20, news    |');
  console.log('  | riskManagement    | VaR, Sharpe, drawdown, hedge       | 14, 15      |');
  console.log('  | marketIndices     | IBOV, IFIX, ETF, FII, segmento     | 17, 8.1     |');
  console.log('  | dataSources       | COTAHIST, BRAPI, Fundamentus       | 18, 20      |');
  console.log('  | cicd              | pipeline, GitHub Actions, husky    | 14, 19      |');
  console.log('  | dataQuality       | outlier, anomalia, threshold       | 11.3, 20    |');
  console.log('  ' + '-'.repeat(74));
  console.log('');
  console.log('  O checklist sera aplicado AUTOMATICAMENTE baseado no seu prompt!');
  console.log('  WebSearch paralelo ativado para pesquisa de best practices.');
  console.log('  Ref: CHECKLIST_ECOSSISTEMA_COMPLETO.md');
  console.log('');
  console.log('='.repeat(78));
  console.log('');

  process.exit(0);
}

// Handle stdin (hooks receive JSON input)
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  main();
});

// Timeout fallback in case stdin doesn't close
setTimeout(() => {
  main();
}, 1000);
