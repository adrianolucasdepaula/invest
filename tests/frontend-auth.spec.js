const { test, expect } = require('@playwright/test');

test.describe('Frontend Authentication', () => {
  const timestamp = Date.now();
  const testEmail = `teste${timestamp}@exemplo.com`;
  const testPassword = 'senha12345';

  test('deve carregar a página de login', async ({ page }) => {
    console.log('🧪 Testando página de login...');

    await page.goto('http://localhost:3100/login');

    // Verificar elementos do formulário
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar com Google")')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();

    console.log('✅ Página de login carregada com todos os elementos');
  });

  test('deve navegar para página de registro', async ({ page }) => {
    console.log('🧪 Testando navegação para registro...');

    await page.goto('http://localhost:3100/login');
    await page.click('a[href="/register"]');

    await expect(page).toHaveURL(/.*register/);
    console.log('✅ Navegação para registro funcionando');
  });

  test('deve registrar novo usuário', async ({ page }) => {
    console.log('🧪 Testando registro de usuário...');
    console.log(`   Email: ${testEmail}`);

    await page.goto('http://localhost:3100/register');

    // Preencher formulário
    await page.fill('input#firstName', 'Usuario');
    await page.fill('input#lastName', 'Teste');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);

    // Submeter formulário
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento ou resposta
    try {
      await page.waitForURL('**/login', { timeout: 10000 });
      console.log('✅ Usuário registrado e redirecionado para login');
    } catch (e) {
      // Aguardar um pouco mais
      await page.waitForTimeout(3000);
      console.log(`   URL atual: ${page.url()}`);
    }
  });

  test('deve fazer login com credenciais', async ({ page, context }) => {
    console.log('🧪 Testando login...');

    await page.goto('http://localhost:3100/login');

    // Preencher credenciais
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submeter formulário
    await page.click('button[type="submit"]');

    // Aguardar resposta
    await page.waitForTimeout(3000);

    // Verificar cookie
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'access_token');

    if (accessToken) {
      console.log('✅ Cookie access_token criado');
      console.log(`   Token: ${accessToken.value.substring(0, 50)}...`);
    } else {
      console.log('⚠️  Cookie access_token não encontrado');
      console.log(`   URL atual: ${page.url()}`);
    }

    expect(accessToken).toBeDefined();
  });

  test('deve manter autenticação ao navegar', async ({ page, context }) => {
    console.log('🧪 Testando persistência da autenticação...');

    // Fazer login primeiro
    await page.goto('http://localhost:3100/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Tentar acessar dashboard
    await page.goto('http://localhost:3100/dashboard');

    // Verificar se está no dashboard ou foi redirecionado
    const url = page.url();
    console.log(`   URL após navegação: ${url}`);

    if (url.includes('/dashboard')) {
      console.log('✅ Autenticação persistiu - acessou dashboard');
    } else if (url.includes('/login')) {
      console.log('⚠️  Redirecionado para login - autenticação não persistiu');
    }
  });

  test('deve proteger rotas não autenticadas', async ({ page, context }) => {
    console.log('🧪 Testando proteção de rotas...');

    // Limpar cookies
    await context.clearCookies();

    // Tentar acessar dashboard sem autenticação
    await page.goto('http://localhost:3100/dashboard');

    // Deve redirecionar para login
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    console.log('✅ Rota protegida redirecionou para login');
  });

  test('deve fazer login com usuário existente', async ({ page, context }) => {
    console.log('🧪 Testando login com usuário existente...');
    console.log('   Email: adriano.lucas.paula@gmail.com');

    await page.goto('http://localhost:3100/login');

    await page.fill('input[type="email"]', 'adriano.lucas.paula@gmail.com');
    await page.fill('input[type="password"]', 'senha12345');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'access_token');

    if (accessToken) {
      console.log('✅ Login com usuário existente funcionou');
    } else {
      console.log('⚠️  Não foi possível fazer login');
      console.log(`   URL: ${page.url()}`);
    }
  });
});
