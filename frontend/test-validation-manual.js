/**
 * Script de validacao manual via HTTP requests
 * Executa validacao de todas as paginas do frontend
 */

const http = require('http');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3101';

const pages = [
  // Paginas publicas
  { name: 'Homepage', path: '/', expectedContent: ['B3', 'Invest', 'Login'] },
  { name: 'Login', path: '/auth/login', expectedContent: ['email', 'password', 'Entrar', 'Login'] },
  { name: 'Register', path: '/auth/register', expectedContent: ['email', 'password', 'Cadastro', 'Register'] },

  // Paginas do dashboard (podem redirecionar para login)
  { name: 'Dashboard', path: '/dashboard', expectedContent: [] },
  { name: 'Assets', path: '/assets', expectedContent: [] },
  { name: 'Assets PETR4', path: '/assets/PETR4', expectedContent: ['PETR4'] },
  { name: 'Analysis', path: '/analysis', expectedContent: [] },
  { name: 'Portfolio', path: '/portfolio', expectedContent: [] },
  { name: 'Reports', path: '/reports', expectedContent: [] },
  { name: 'Data Sources', path: '/data-sources', expectedContent: [] },
  { name: 'Data Management', path: '/data-management', expectedContent: [] },
  { name: 'OAuth Manager', path: '/oauth-manager', expectedContent: [] },
  { name: 'Settings', path: '/settings', expectedContent: [] },
];

const apiEndpoints = [
  { name: 'Health', path: '/api/v1/health' },
  { name: 'Assets', path: '/api/v1/assets?limit=5' },
  { name: 'Asset PETR4', path: '/api/v1/assets/PETR4' },
  { name: 'Data Sources', path: '/api/v1/data-sources' },
];

async function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, error: 'Timeout' });
    });
  });
}

async function validatePages() {
  console.log('\\n========================================');
  console.log('VALIDACAO DE PAGINAS FRONTEND');
  console.log('========================================\\n');

  const results = [];

  for (const page of pages) {
    const url = `${FRONTEND_URL}${page.path}`;
    const result = await fetchUrl(url);

    let status = 'UNKNOWN';
    let details = '';

    if (result.error) {
      status = 'ERROR';
      details = result.error;
    } else if (result.status >= 200 && result.status < 400) {
      status = 'OK';
      // Check expected content
      const hasContent = page.expectedContent.length === 0 ||
        page.expectedContent.some(c => result.data.toLowerCase().includes(c.toLowerCase()));
      if (!hasContent) {
        status = 'WARN';
        details = 'Expected content not found';
      }
    } else {
      status = 'FAIL';
      details = `HTTP ${result.status}`;
    }

    results.push({ ...page, status, details, httpStatus: result.status });
    console.log(`[${status.padEnd(5)}] ${page.name.padEnd(20)} (${page.path}) - HTTP ${result.status} ${details}`);
  }

  return results;
}

async function validateAPI() {
  console.log('\\n========================================');
  console.log('VALIDACAO DE API BACKEND');
  console.log('========================================\\n');

  const results = [];

  for (const endpoint of apiEndpoints) {
    const url = `${BACKEND_URL}${endpoint.path}`;
    const result = await fetchUrl(url);

    let status = 'UNKNOWN';
    let details = '';

    if (result.error) {
      status = 'ERROR';
      details = result.error;
    } else if (result.status >= 200 && result.status < 300) {
      status = 'OK';
      try {
        const json = JSON.parse(result.data);
        if (Array.isArray(json)) {
          details = `${json.length} items`;
        } else if (json.data && Array.isArray(json.data)) {
          details = `${json.data.length} items`;
        } else {
          details = 'JSON OK';
        }
      } catch (e) {
        details = 'Response OK (not JSON)';
      }
    } else {
      status = 'FAIL';
      details = `HTTP ${result.status}`;
    }

    results.push({ ...endpoint, status, details, httpStatus: result.status });
    console.log(`[${status.padEnd(5)}] ${endpoint.name.padEnd(20)} (${endpoint.path}) - HTTP ${result.status} ${details}`);
  }

  return results;
}

async function main() {
  console.log('\\n========================================');
  console.log('VALIDACAO ULTRA-COMPLETA - 2025-11-29');
  console.log('========================================\\n');

  const pageResults = await validatePages();
  const apiResults = await validateAPI();

  console.log('\\n========================================');
  console.log('RESUMO');
  console.log('========================================\\n');

  const pageOk = pageResults.filter(r => r.status === 'OK').length;
  const pageFail = pageResults.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
  const pageWarn = pageResults.filter(r => r.status === 'WARN').length;

  const apiOk = apiResults.filter(r => r.status === 'OK').length;
  const apiFail = apiResults.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;

  console.log(`Frontend Pages: ${pageOk}/${pages.length} OK, ${pageWarn} WARN, ${pageFail} FAIL`);
  console.log(`Backend API:    ${apiOk}/${apiEndpoints.length} OK, ${apiFail} FAIL`);

  const report = {
    timestamp: new Date().toISOString(),
    frontend: {
      total: pages.length,
      ok: pageOk,
      warn: pageWarn,
      fail: pageFail,
      results: pageResults
    },
    api: {
      total: apiEndpoints.length,
      ok: apiOk,
      fail: apiFail,
      results: apiResults
    }
  };

  console.log('\\nReport JSON:');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);
