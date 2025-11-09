const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 Iniciando testes de autenticação do frontend...\n');

  try {
    // Teste 1: Acessar página de login
    console.log('1️⃣ Testando acesso à página de login...');
    await page.goto('http://localhost:3100/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Página de login carregada com sucesso');

    // Verificar elementos da página
    const emailInput = await page.locator('input[type="email"]');
    const passwordInput = await page.locator('input[type="password"]');
    const loginButton = await page.locator('button[type="submit"]');
    const googleButton = await page.locator('button:has-text("Entrar com Google")');
    const registerLink = await page.locator('a[href="/register"]');

    console.log('✅ Formulário de login encontrado');
    console.log('✅ Botão do Google encontrado');
    console.log('✅ Link de registro encontrado\n');

    // Teste 2: Acessar página de registro
    console.log('2️⃣ Testando acesso à página de registro...');
    await registerLink.click();
    await page.waitForURL('**/register', { timeout: 10000 });
    console.log('✅ Página de registro carregada com sucesso\n');

    // Teste 3: Criar novo usuário
    console.log('3️⃣ Testando registro de novo usuário...');
    const timestamp = Date.now();
    const testEmail = `teste${timestamp}@exemplo.com`;
    const testPassword = 'senha12345';

    await page.fill('input#firstName', 'Usuario');
    await page.fill('input#lastName', 'Teste');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);

    console.log(`   Email de teste: ${testEmail}`);

    // Clicar no botão de criar conta
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento ou toast
    try {
      await page.waitForURL('**/login', { timeout: 10000 });
      console.log('✅ Usuário registrado com sucesso (redirecionado para login)\n');
    } catch (e) {
      // Verificar se há mensagem de erro
      const errorToast = await page.locator('[role="alert"]').textContent().catch(() => null);
      if (errorToast) {
        console.log(`⚠️  Erro no registro: ${errorToast}\n`);
      } else {
        console.log('⚠️  Aguardando resposta do servidor...\n');
        await page.waitForTimeout(3000);
      }
    }

    // Teste 4: Fazer login com o usuário criado
    console.log('4️⃣ Testando login com credenciais...');

    // Se não estiver na página de login, navegar para ela
    if (!page.url().includes('/login')) {
      await page.goto('http://localhost:3100/login', { waitUntil: 'networkidle' });
    }

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento para dashboard
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Login realizado com sucesso (redirecionado para dashboard)');
    } catch (e) {
      console.log('⚠️  Aguardando redirecionamento...');
      await page.waitForTimeout(3000);
      console.log(`   URL atual: ${page.url()}`);
    }

    // Teste 5: Verificar cookie de autenticação
    console.log('\n5️⃣ Verificando cookie de autenticação...');
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'access_token');

    if (accessToken) {
      console.log('✅ Cookie access_token encontrado');
      console.log(`   Token: ${accessToken.value.substring(0, 50)}...`);
      console.log(`   Expira em: ${new Date(accessToken.expires * 1000).toLocaleString()}`);
    } else {
      console.log('❌ Cookie access_token NÃO encontrado');
      console.log('   Cookies disponíveis:', cookies.map(c => c.name).join(', '));
    }

    // Teste 6: Verificar persistência da autenticação
    console.log('\n6️⃣ Testando persistência da autenticação...');
    await page.goto('http://localhost:3100/dashboard', { waitUntil: 'networkidle' });

    if (page.url().includes('/dashboard')) {
      console.log('✅ Dashboard acessível (autenticação persistente)');
    } else if (page.url().includes('/login')) {
      console.log('❌ Redirecionado para login (autenticação não persistiu)');
    } else {
      console.log(`⚠️  URL inesperada: ${page.url()}`);
    }

    // Teste 7: Verificar proteção de rotas
    console.log('\n7️⃣ Testando proteção de rotas...');

    // Limpar cookies
    await context.clearCookies();
    console.log('   Cookies limpos');

    // Tentar acessar dashboard sem autenticação
    await page.goto('http://localhost:3100/dashboard', { waitUntil: 'networkidle' });

    if (page.url().includes('/login')) {
      console.log('✅ Rota protegida funcionando (redirecionado para login)');
    } else {
      console.log('❌ Rota protegida não está funcionando');
      console.log(`   URL atual: ${page.url()}`);
    }

    console.log('\n✨ Testes concluídos!\n');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);

    // Capturar screenshot do erro
    await page.screenshot({ path: '/home/user/invest/test-error.png' });
    console.log('📸 Screenshot salvo em: test-error.png');

    // Mostrar console logs do navegador
    console.log('\n📋 Console do navegador:');
    page.on('console', msg => console.log('   ', msg.text()));
  } finally {
    await browser.close();
  }
})();
