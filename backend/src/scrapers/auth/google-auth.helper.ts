import { Page } from 'puppeteer';
import { Logger } from '@nestjs/common';

export class GoogleAuthHelper {
  private static readonly logger = new Logger(GoogleAuthHelper.name);

  /**
   * Performs Google login on a page
   */
  static async loginWithGoogle(
    page: Page,
    email: string,
    password: string,
    loginButtonSelector: string = 'button:contains("Google"), a:contains("Google")',
  ): Promise<void> {
    try {
      this.logger.log('Starting Google login process');

      // Click on "Login with Google" button
      await page.waitForSelector(loginButtonSelector, { timeout: 10000 }).catch(() => {
        this.logger.warn('Google login button not found with default selector');
      });

      // Try different common selectors for Google login button
      const googleButtonSelectors = [
        loginButtonSelector,
        'button[data-provider="google"]',
        'a[href*="google"]',
        '.google-login',
        '#google-login',
        '[aria-label*="Google"]',
      ];

      let buttonClicked = false;
      for (const selector of googleButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            buttonClicked = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!buttonClicked) {
        throw new Error('Could not find Google login button');
      }

      // Wait for Google login page
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

      // Wait for email input
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Enter email
      await page.type('input[type="email"]', email, { delay: 100 });
      this.logger.log('Email entered');

      // Click "Next" button
      await this.clickNextButton(page);

      // Wait for password input
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await this.wait(1000);

      // Enter password
      await page.type('input[type="password"]', password, { delay: 100 });
      this.logger.log('Password entered');

      // Click "Next" button
      await this.clickNextButton(page);

      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
        this.logger.warn('Navigation timeout after login');
      });

      // Handle 2FA or additional verification if present
      await this.handle2FA(page);

      this.logger.log('Google login completed');
    } catch (error) {
      this.logger.error(`Google login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Click the "Next" button on Google login page
   */
  private static async clickNextButton(page: Page): Promise<void> {
    const nextButtonSelectors = [
      '#identifierNext button',
      '#passwordNext button',
      'button:contains("Next")',
      'button:contains("Próxima")',
      '[type="button"][jsname]',
    ];

    for (const selector of nextButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await this.wait(2000);
          return;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: press Enter
    await page.keyboard.press('Enter');
    await this.wait(2000);
  }

  /**
   * Handle 2FA if present
   */
  private static async handle2FA(page: Page): Promise<void> {
    try {
      // Check if 2FA is required
      const has2FA = await page.$('input[type="tel"]').catch(() => null);

      if (has2FA) {
        this.logger.warn('2FA detected - manual intervention required');
        this.logger.warn('Please complete 2FA verification manually');

        // Wait for manual 2FA completion (up to 2 minutes)
        await page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 120000,
        }).catch(() => {
          this.logger.warn('2FA timeout - user may still be completing verification');
        });
      }
    } catch (error) {
      this.logger.warn(`2FA check failed: ${error.message}`);
    }
  }

  /**
   * Check if already logged in to Google
   */
  static async isLoggedIn(page: Page): Promise<boolean> {
    try {
      // Check for common indicators of being logged in
      const loggedInSelectors = [
        '.user-profile',
        '[data-user]',
        '.account-info',
        'img[alt*="Profile"]',
      ];

      for (const selector of loggedInSelectors) {
        const element = await page.$(selector).catch(() => null);
        if (element) {
          return true;
        }
      }

      // Check URL
      const url = page.url();
      if (url.includes('accounts.google.com')) {
        return false;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait helper
   */
  private static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Save Google session cookies for reuse
   */
  static async saveSession(page: Page, filePath: string): Promise<void> {
    try {
      const cookies = await page.cookies();
      const fs = require('fs');
      fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
      this.logger.log(`Session saved to ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to save session: ${error.message}`);
    }
  }

  /**
   * Load Google session cookies
   */
  static async loadSession(page: Page, filePath: string): Promise<boolean> {
    try {
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const cookiesString = fs.readFileSync(filePath, 'utf8');
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
      this.logger.log(`Session loaded from ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to load session: ${error.message}`);
      return false;
    }
  }
}
