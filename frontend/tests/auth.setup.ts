import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ request, page }) => {
    setup.slow(); // ✅ Triplicar timeout (30s → 90s) para auth setup

    // Login via API directly (more reliable than UI)
    const response = await request.post('http://localhost:3101/api/v1/auth/login', {
        data: {
            email: 'admin@invest.com',
            password: 'Admin@123'
        }
    });

    if (!response.ok()) {
        throw new Error(`Login failed with status ${response.status()}`);
    }

    const loginData = await response.json();

    if (!loginData.token) {
        throw new Error('No token returned from login API');
    }

    console.log('✓ Login API successful, token received');

    // Set the access_token cookie manually
    await page.context().addCookies([{
        name: 'access_token',
        value: loginData.token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }]);

    console.log('✓ Cookie set');

    // Navigate to dashboard to verify auth works
    await page.goto('/dashboard');
    await page.waitForLoadState('load'); // ✅ Usar 'load' ao invés de 'networkidle' (WebSocket mantém conexão ativa)

    // Verify we're authenticated by waiting for dashboard content
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    const url = page.url();
    if (!url.includes('/dashboard')) {
        throw new Error(`Expected to be on /dashboard but got ${url}`);
    }

    console.log('✓ Authenticated and on dashboard');

    // Save authenticated state
    await page.context().storageState({ path: authFile });

    console.log('✓ Storage state saved to', authFile);
});
