#!/usr/bin/env node

/**
 * Sync All Assets - Full Historical Data (1986-2024)
 *
 * Sincroniza TODOS os ativos com histórico completo do COTAHIST B3.
 *
 * Usage: node sync-all-assets-full-history.js
 */

const https = require('http');
const fs = require('fs');

const CONFIG = {
  apiUrl: 'http://localhost:3101/api/v1',
  startYear: 1986,
  endYear: 2024,
  maxParallel: 5,  // Sync 5 ativos em paralelo
  logFile: 'sync-all-assets.log',
};

// Logger
const log = (message) => {
  console.log(message);
  fs.appendFileSync(CONFIG.logFile, message + '\n');
};

// Fetch assets
async function fetchAssets() {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.apiUrl}/assets`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const assets = JSON.parse(data);
          const tickers = assets.map(a => a.ticker).filter(Boolean).sort();
          resolve(tickers);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Sync single ticker
async function syncTicker(ticker, current, total) {
  return new Promise((resolve) => {
    log(`[${current}/${total}] Syncing ${ticker}...`);

    const startTime = Date.now();
    const payload = JSON.stringify({
      ticker,
      startYear: CONFIG.startYear,
      endYear: CONFIG.endYear,
    });

    const options = {
      hostname: 'localhost',
      port: 3101,
      path: '/api/v1/market-data/sync-cotahist',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            log(`  ✅ SUCCESS: ${ticker} (${result.totalRecords} records, ${duration}s)`);
            resolve({ ticker, success: true, records: result.totalRecords, duration });
          } catch (err) {
            log(`  ❌ FAILED: ${ticker} (Parse error, ${duration}s)`);
            resolve({ ticker, success: false, error: 'Parse error', duration });
          }
        } else {
          log(`  ❌ FAILED: ${ticker} (HTTP ${res.statusCode}, ${duration}s)`);
          log(`  Error: ${data}`);
          resolve({ ticker, success: false, error: data, duration });
        }
      });
    });

    req.on('error', (err) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`  ❌ FAILED: ${ticker} (Network error: ${err.message}, ${duration}s)`);
      resolve({ ticker, success: false, error: err.message, duration });
    });

    req.write(payload);
    req.end();
  });
}

// Run syncs in parallel batches
async function syncAllAssets(tickers) {
  const total = tickers.length;
  const results = [];

  for (let i = 0; i < total; i += CONFIG.maxParallel) {
    const batch = tickers.slice(i, i + CONFIG.maxParallel);
    const batchResults = await Promise.all(
      batch.map((ticker, idx) => syncTicker(ticker, i + idx + 1, total))
    );
    results.push(...batchResults);
  }

  return results;
}

// Main
(async () => {
  console.log('==========================================');
  console.log(' Sync All Assets - Full History (1986-2024)');
  console.log('==========================================\n');

  // Clear log file
  fs.writeFileSync(CONFIG.logFile, '');

  log('Fetching asset list...\n');

  try {
    const tickers = await fetchAssets();
    log(`Found ${tickers.length} assets\n`);
    log(`Starting sync with ${CONFIG.maxParallel} parallel jobs...`);
    log(`Start Year: ${CONFIG.startYear}`);
    log(`End Year: ${CONFIG.endYear}\n`);

    const startTime = Date.now();
    const results = await syncAllAssets(tickers);
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log('');
    log('==========================================');
    log(' Sync Complete!');
    log('==========================================');
    log(`Total Assets: ${tickers.length}`);
    log(`Success: ${success}`);
    log(`Failed: ${failed}`);
    log(`Total Time: ${totalTime} minutes`);
    log('');
    log(`Check logs: ${CONFIG.logFile}`);
    log('==========================================');

  } catch (err) {
    log(`\n❌ Fatal error: ${err.message}`);
    process.exit(1);
  }
})();
