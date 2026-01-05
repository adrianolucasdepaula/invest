/**
 * Self-Healing Locator System for Playwright Tests
 *
 * Implements resilient element location with automatic fallback strategies.
 * When primary locators fail, the system tries alternative strategies and
 * reports healing events for analysis.
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @license FREE (Apache 2.0 compatible)
 */

import type { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Locator strategy types
 */
export type LocatorStrategy =
  | 'ref'           // Playwright's built-in ref (from snapshot)
  | 'data-testid'   // data-testid attribute
  | 'aria-label'    // aria-label attribute
  | 'aria-role'     // ARIA role + name
  | 'text'          // Text content
  | 'placeholder'   // Input placeholder
  | 'css'           // CSS selector (fallback)
  | 'xpath';        // XPath (last resort)

/**
 * Self-healing configuration
 */
export interface SelfHealingConfig {
  /** Ordered list of strategies to try */
  strategies: LocatorStrategy[];
  /** Maximum attempts before giving up */
  maxAttempts: number;
  /** Report healing events to file */
  reportHealing: boolean;
  /** Path to healing report file */
  reportPath?: string;
  /** Timeout per strategy attempt (ms) */
  strategyTimeout: number;
  /** Enable verbose logging */
  verbose: boolean;
}

/**
 * Element definition for self-healing lookup
 */
export interface ElementDefinition {
  /** Primary identifier (usually data-testid) */
  id: string;
  /** Human-readable description */
  description: string;
  /** Alternative selectors for fallback */
  alternatives?: {
    ref?: string;
    ariaLabel?: string;
    ariaRole?: { role: string; name?: string };
    text?: string | RegExp;
    placeholder?: string;
    css?: string;
    xpath?: string;
  };
}

/**
 * Healing event record
 */
export interface HealingEvent {
  timestamp: string;
  elementId: string;
  description: string;
  primaryStrategy: LocatorStrategy;
  primarySelector: string;
  healedStrategy: LocatorStrategy;
  healedSelector: string;
  attemptsCount: number;
  page: string;
  testFile?: string;
}

/**
 * Healing report
 */
export interface HealingReport {
  generatedAt: string;
  totalElements: number;
  healedElements: number;
  failedElements: number;
  healingRate: number;
  events: HealingEvent[];
  strategySuccessRate: Record<LocatorStrategy, { attempts: number; successes: number }>;
}

/**
 * Default configuration
 */
export const defaultSelfHealingConfig: SelfHealingConfig = {
  strategies: ['data-testid', 'aria-label', 'aria-role', 'text', 'placeholder', 'css'],
  maxAttempts: 6,
  reportHealing: true,
  reportPath: 'frontend/reports/self-healing-report.json',
  strategyTimeout: 2000,
  verbose: false,
};

/**
 * In-memory healing events store
 */
const healingEvents: HealingEvent[] = [];

/**
 * Strategy success tracking
 */
const strategyStats: Record<LocatorStrategy, { attempts: number; successes: number }> = {
  ref: { attempts: 0, successes: 0 },
  'data-testid': { attempts: 0, successes: 0 },
  'aria-label': { attempts: 0, successes: 0 },
  'aria-role': { attempts: 0, successes: 0 },
  text: { attempts: 0, successes: 0 },
  placeholder: { attempts: 0, successes: 0 },
  css: { attempts: 0, successes: 0 },
  xpath: { attempts: 0, successes: 0 },
};

/**
 * Self-Healing Locator class
 *
 * Wraps Playwright's locator with automatic fallback capabilities.
 */
export class SelfHealingLocator {
  private page: Page;
  private config: SelfHealingConfig;
  private lastHealedStrategy?: LocatorStrategy;

  constructor(page: Page, config: Partial<SelfHealingConfig> = {}) {
    this.page = page;
    this.config = { ...defaultSelfHealingConfig, ...config };
  }

  /**
   * Find element with self-healing capability
   *
   * @param element - Element definition with alternatives
   * @returns Playwright Locator
   */
  async find(element: ElementDefinition): Promise<Locator> {
    const { strategies, maxAttempts, strategyTimeout, verbose } = this.config;
    let attempts = 0;
    let lastError: Error | null = null;

    // Try primary strategy first (data-testid)
    const primaryLocator = this.getLocatorForStrategy('data-testid', element);
    if (primaryLocator) {
      strategyStats['data-testid'].attempts++;
      try {
        await primaryLocator.waitFor({ state: 'visible', timeout: strategyTimeout });
        strategyStats['data-testid'].successes++;
        if (verbose) {
          console.log(`✅ [SelfHealing] Found ${element.id} with primary strategy (data-testid)`);
        }
        return primaryLocator;
      } catch {
        // Primary failed, try alternatives
        if (verbose) {
          console.log(`⚠️ [SelfHealing] Primary strategy failed for ${element.id}, trying alternatives...`);
        }
      }
    }

    // Try alternative strategies
    for (const strategy of strategies) {
      if (strategy === 'data-testid') continue; // Already tried
      if (attempts >= maxAttempts) break;

      attempts++;
      const locator = this.getLocatorForStrategy(strategy, element);
      if (!locator) continue;

      strategyStats[strategy].attempts++;
      try {
        await locator.waitFor({ state: 'visible', timeout: strategyTimeout });
        strategyStats[strategy].successes++;
        this.lastHealedStrategy = strategy;

        // Record healing event
        this.recordHealingEvent(element, 'data-testid', strategy, attempts);

        if (verbose) {
          console.log(`🔧 [SelfHealing] Healed ${element.id} using ${strategy} strategy`);
        }

        return locator;
      } catch (error) {
        lastError = error as Error;
        if (verbose) {
          console.log(`❌ [SelfHealing] Strategy ${strategy} failed for ${element.id}`);
        }
      }
    }

    // All strategies failed
    throw new Error(
      `[SelfHealing] Could not locate element "${element.id}" after ${attempts} attempts. ` +
        `Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Find and click element with self-healing
   */
  async click(element: ElementDefinition): Promise<void> {
    const locator = await this.find(element);
    await locator.click();
  }

  /**
   * Find and fill element with self-healing
   */
  async fill(element: ElementDefinition, value: string): Promise<void> {
    const locator = await this.find(element);
    await locator.fill(value);
  }

  /**
   * Find and check element state with self-healing
   */
  async isVisible(element: ElementDefinition): Promise<boolean> {
    try {
      const locator = await this.find(element);
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get locator for specific strategy
   */
  private getLocatorForStrategy(
    strategy: LocatorStrategy,
    element: ElementDefinition
  ): Locator | null {
    const { alternatives } = element;

    switch (strategy) {
      case 'data-testid':
        return this.page.getByTestId(element.id);

      case 'aria-label':
        if (alternatives?.ariaLabel) {
          return this.page.getByLabel(alternatives.ariaLabel);
        }
        break;

      case 'aria-role':
        if (alternatives?.ariaRole) {
          const { role, name } = alternatives.ariaRole;
          return this.page.getByRole(role as any, name ? { name } : undefined);
        }
        break;

      case 'text':
        if (alternatives?.text) {
          return this.page.getByText(alternatives.text);
        }
        break;

      case 'placeholder':
        if (alternatives?.placeholder) {
          return this.page.getByPlaceholder(alternatives.placeholder);
        }
        break;

      case 'css':
        if (alternatives?.css) {
          return this.page.locator(alternatives.css);
        }
        break;

      case 'xpath':
        if (alternatives?.xpath) {
          return this.page.locator(`xpath=${alternatives.xpath}`);
        }
        break;

      case 'ref':
        if (alternatives?.ref) {
          return this.page.locator(`[ref="${alternatives.ref}"]`);
        }
        break;
    }

    return null;
  }

  /**
   * Record healing event for analysis
   */
  private recordHealingEvent(
    element: ElementDefinition,
    primaryStrategy: LocatorStrategy,
    healedStrategy: LocatorStrategy,
    attempts: number
  ): void {
    const event: HealingEvent = {
      timestamp: new Date().toISOString(),
      elementId: element.id,
      description: element.description,
      primaryStrategy,
      primarySelector: `[data-testid="${element.id}"]`,
      healedStrategy,
      healedSelector: this.getSelectorDescription(healedStrategy, element),
      attemptsCount: attempts,
      page: this.page.url(),
    };

    healingEvents.push(event);

    if (this.config.reportHealing) {
      this.saveHealingReport();
    }
  }

  /**
   * Get selector description for reporting
   */
  private getSelectorDescription(strategy: LocatorStrategy, element: ElementDefinition): string {
    const { alternatives } = element;
    switch (strategy) {
      case 'aria-label':
        return `[aria-label="${alternatives?.ariaLabel}"]`;
      case 'aria-role':
        return `role=${alternatives?.ariaRole?.role}${alternatives?.ariaRole?.name ? `, name="${alternatives.ariaRole.name}"` : ''}`;
      case 'text':
        return `text=${alternatives?.text}`;
      case 'placeholder':
        return `[placeholder="${alternatives?.placeholder}"]`;
      case 'css':
        return alternatives?.css || '';
      case 'xpath':
        return alternatives?.xpath || '';
      default:
        return '';
    }
  }

  /**
   * Save healing report to file
   */
  private saveHealingReport(): void {
    const reportPath = this.config.reportPath || 'frontend/reports/self-healing-report.json';
    const dir = path.dirname(reportPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const report = generateHealingReport();
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  /**
   * Get last healed strategy (for debugging)
   */
  getLastHealedStrategy(): LocatorStrategy | undefined {
    return this.lastHealedStrategy;
  }
}

/**
 * Generate healing report
 */
export function generateHealingReport(): HealingReport {
  const totalElements = healingEvents.length;
  const healedElements = healingEvents.filter(e => e.healedStrategy !== 'data-testid').length;
  const failedElements = 0; // Failures throw, so we don't track them here

  return {
    generatedAt: new Date().toISOString(),
    totalElements,
    healedElements,
    failedElements,
    healingRate: totalElements > 0 ? healedElements / totalElements : 0,
    events: healingEvents,
    strategySuccessRate: { ...strategyStats },
  };
}

/**
 * Clear healing events (for test cleanup)
 */
export function clearHealingEvents(): void {
  healingEvents.length = 0;
}

/**
 * Get healing events (for assertions)
 */
export function getHealingEvents(): HealingEvent[] {
  return [...healingEvents];
}

/**
 * Get strategy statistics
 */
export function getStrategyStats(): Record<LocatorStrategy, { attempts: number; successes: number }> {
  return { ...strategyStats };
}

/**
 * Reset strategy statistics (for test cleanup)
 */
export function resetStrategyStats(): void {
  for (const strategy of Object.keys(strategyStats) as LocatorStrategy[]) {
    strategyStats[strategy] = { attempts: 0, successes: 0 };
  }
}

/**
 * Create self-healing locator for page
 *
 * @param page - Playwright page
 * @param config - Optional configuration
 * @returns SelfHealingLocator instance
 */
export function createSelfHealingLocator(
  page: Page,
  config?: Partial<SelfHealingConfig>
): SelfHealingLocator {
  return new SelfHealingLocator(page, config);
}

/**
 * Pre-defined element definitions for common B3 AI Platform components
 */
export const commonElements: Record<string, ElementDefinition> = {
  // Navigation
  sidebar: {
    id: 'sidebar',
    description: 'Main navigation sidebar',
    alternatives: {
      ariaRole: { role: 'navigation', name: 'Main' },
      css: 'nav.sidebar',
    },
  },
  dashboardLink: {
    id: 'nav-dashboard',
    description: 'Dashboard navigation link',
    alternatives: {
      ariaRole: { role: 'link', name: 'Dashboard' },
      text: 'Dashboard',
    },
  },
  assetsLink: {
    id: 'nav-assets',
    description: 'Assets navigation link',
    alternatives: {
      ariaRole: { role: 'link', name: 'Ativos' },
      text: /Ativos/i,
    },
  },

  // Forms
  searchInput: {
    id: 'search-input',
    description: 'Global search input',
    alternatives: {
      placeholder: 'Buscar...',
      ariaLabel: 'Search',
      css: 'input[type="search"]',
    },
  },
  submitButton: {
    id: 'submit-btn',
    description: 'Form submit button',
    alternatives: {
      ariaRole: { role: 'button', name: 'Salvar' },
      text: 'Salvar',
      css: 'button[type="submit"]',
    },
  },

  // Tables
  dataTable: {
    id: 'data-table',
    description: 'Main data table',
    alternatives: {
      ariaRole: { role: 'table' },
      css: 'table.data-table',
    },
  },

  // Dialogs
  modal: {
    id: 'modal-dialog',
    description: 'Modal dialog',
    alternatives: {
      ariaRole: { role: 'dialog' },
      css: '[role="dialog"]',
    },
  },
  modalClose: {
    id: 'modal-close',
    description: 'Modal close button',
    alternatives: {
      ariaLabel: 'Fechar',
      ariaRole: { role: 'button', name: 'Fechar' },
      css: 'button.dialog-close',
    },
  },

  // Alerts
  toastSuccess: {
    id: 'toast-success',
    description: 'Success toast notification',
    alternatives: {
      ariaRole: { role: 'alert' },
      css: '[role="alert"].success',
    },
  },
  toastError: {
    id: 'toast-error',
    description: 'Error toast notification',
    alternatives: {
      ariaRole: { role: 'alert' },
      css: '[role="alert"].error',
    },
  },
};

/**
 * Utility: Create element definition inline
 */
export function element(
  id: string,
  description: string,
  alternatives?: ElementDefinition['alternatives']
): ElementDefinition {
  return { id, description, alternatives };
}

/**
 * Print healing summary to console
 */
export function printHealingSummary(): void {
  const report = generateHealingReport();

  console.log('\n🔧 Self-Healing Report\n');
  console.log(`📅 Generated: ${report.generatedAt}`);
  console.log(`📊 Total Elements: ${report.totalElements}`);
  console.log(`✅ Healed: ${report.healedElements}`);
  console.log(`❌ Failed: ${report.failedElements}`);
  console.log(`📈 Healing Rate: ${(report.healingRate * 100).toFixed(1)}%`);

  console.log('\n📊 Strategy Success Rates:\n');
  for (const [strategy, stats] of Object.entries(report.strategySuccessRate)) {
    if (stats.attempts > 0) {
      const rate = ((stats.successes / stats.attempts) * 100).toFixed(1);
      console.log(`  ${strategy}: ${stats.successes}/${stats.attempts} (${rate}%)`);
    }
  }

  if (report.events.length > 0) {
    console.log('\n🔧 Recent Healing Events:\n');
    for (const event of report.events.slice(-5)) {
      console.log(`  - ${event.elementId}: ${event.primaryStrategy} → ${event.healedStrategy}`);
    }
  }

  console.log('');
}
