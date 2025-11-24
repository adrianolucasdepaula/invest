import { test, expect } from '@playwright/test';

test.describe('Login Debug', () => {
    test('debug login flow step by step', async ({ page }) => {
        // Enable console logging
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.error('PAGE ERROR:', error));

        // Go to login page
        await page.goto('/login');
        console.log('✓ Navigated to /login');

        // Wait for page to be ready
        await page.waitForLoadState('networkidle');
        console.log('✓ Page loaded');

        // Fill email
        const emailInput = page.getByPlaceholder('seu@email.com');
        await emailInput.fill('admin@invest.com');
        console.log('✓ Email filled');

        // Fill password  
        const passwordInput = page.getByPlaceholder('••••••••');
        await passwordInput.fill('Admin@123');
        console.log('✓ Password filled');

        // Setup request listener BEFORE clicking
        const loginPromise = page.waitForResponse(
            response => response.url().includes('/auth/login') && response.status() === 200,
            { timeout: 10000 }
        );

        // Click login button
        const loginButton = page.getByRole('button', { name: 'Entrar' });
        await loginButton.click();
        console.log('✓ Login button clicked');

        // Wait for API response
        const loginResponse = await loginPromise;
        const responseData = await loginResponse.json();
        console.log('API Response:', responseData);

        // Check if token is in response
        expect(responseData).toHaveProperty('token');
        console.log('✓ Token present in response');

        // Check if cookie was set
        const cookies = await page.context().cookies();
        const accessTokenCookie = cookies.find(c => c.name === 'access_token');
        console.log('Cookies:', cookies.map(c => c.name));
        console.log('Access token cookie:', accessTokenCookie);

        if (!accessTokenCookie) {
            console.error('❌ access_token cookie NOT set!');
            throw new Error('access_token cookie was not set after login');
        }

        console.log('✓ access_token cookie set');

        // Wait for navigation or check current URL
        await page.waitForTimeout(2000); // Give time for redirect
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);

        // Try to navigate manually if needed
        if (!currentUrl.includes('/dashboard')) {
            console.log('Not on dashboard, attempting manual navigation...');
            await page.goto('/dashboard');
        }

        // Verify we're on dashboard
        await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 5000 });
        console.log('✓ Successfully on Dashboard');
    });
});
