/**
 * widgetConfigBuilder - Widget Configuration Builder
 *
 * Fluent API for building TradingView widget configurations.
 *
 * @module tradingview/utils/widgetConfigBuilder
 * @version 1.0.0
 * @created 2025-11-20
 */

import type {
  BaseTradingViewProps,
  TradingViewTheme,
  TradingViewLocale,
} from '../types';
import { DEFAULT_THEME, DEFAULT_LOCALE } from '../constants';

// ============================================================================
// WIDGET CONFIG BUILDER
// ============================================================================

/**
 * Fluent API builder for widget configurations
 *
 * @example
 * ```ts
 * const config = new WidgetConfigBuilder()
 *   .setTheme('dark')
 *   .setLocale('pt_BR')
 *   .setAutosize(true)
 *   .addCustomProp('showSymbolLogo', true)
 *   .build();
 * ```
 */
export class WidgetConfigBuilder<TConfig = Record<string, any>> {
  private config: Partial<TConfig & BaseTradingViewProps>;

  constructor(initialConfig: Partial<TConfig & BaseTradingViewProps> = {}) {
    this.config = { ...initialConfig };
  }

  /**
   * Set theme
   */
  setTheme(theme: TradingViewTheme): this {
    (this.config as any).theme = theme;
    return this;
  }

  /**
   * Set locale
   */
  setLocale(locale: TradingViewLocale): this {
    (this.config as any).locale = locale;
    return this;
  }

  /**
   * Set autosize
   */
  setAutosize(autosize: boolean): this {
    (this.config as any).autosize = autosize;
    return this;
  }

  /**
   * Set width
   */
  setWidth(width: number | string): this {
    (this.config as any).width = width;
    (this.config as any).autosize = false; // Disable autosize if width is set
    return this;
  }

  /**
   * Set height
   */
  setHeight(height: number | string): this {
    (this.config as any).height = height;
    (this.config as any).autosize = false; // Disable autosize if height is set
    return this;
  }

  /**
   * Set dimensions (width + height)
   */
  setDimensions(width: number | string, height: number | string): this {
    (this.config as any).width = width;
    (this.config as any).height = height;
    (this.config as any).autosize = false;
    return this;
  }

  /**
   * Set container ID
   */
  setContainerId(containerId: string): this {
    (this.config as any).container_id = containerId;
    return this;
  }

  /**
   * Add custom property
   */
  addCustomProp<K extends keyof TConfig>(key: K, value: TConfig[K]): this {
    (this.config as any)[key] = value;
    return this;
  }

  /**
   * Merge with another config
   */
  merge(otherConfig: Partial<TConfig & BaseTradingViewProps>): this {
    this.config = { ...this.config, ...otherConfig };
    return this;
  }

  /**
   * Set defaults (theme, locale, autosize)
   */
  setDefaults(): this {
    if (!(this.config as any).theme) {
      (this.config as any).theme = DEFAULT_THEME;
    }
    if (!(this.config as any).locale) {
      (this.config as any).locale = DEFAULT_LOCALE;
    }
    if ((this.config as any).autosize === undefined) {
      (this.config as any).autosize = true;
    }
    return this;
  }

  /**
   * Build final configuration
   */
  build(): TConfig & BaseTradingViewProps {
    return this.config as TConfig & BaseTradingViewProps;
  }

  /**
   * Create a new builder from current config (immutable)
   */
  clone(): WidgetConfigBuilder<TConfig> {
    return new WidgetConfigBuilder<TConfig>({ ...this.config });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a base widget config with defaults
 *
 * @example
 * ```ts
 * const baseConfig = createBaseConfig({
 *   theme: 'dark',
 *   locale: 'pt_BR',
 *   autosize: true,
 * });
 * ```
 */
export function createBaseConfig(
  overrides: Partial<BaseTradingViewProps> = {}
): BaseTradingViewProps {
  return new WidgetConfigBuilder(overrides)
    .setDefaults()
    .build();
}

/**
 * Merge multiple configs (last one wins)
 *
 * @example
 * ```ts
 * const merged = mergeConfigs(
 *   { theme: 'light', locale: 'en' },
 *   { theme: 'dark' }, // This theme wins
 * );
 * // Result: { theme: 'dark', locale: 'en' }
 * ```
 */
export function mergeConfigs<T extends Record<string, any>>(
  ...configs: Partial<T>[]
): T {
  return Object.assign({}, ...configs) as T;
}

/**
 * Remove undefined/null properties from config
 *
 * @example
 * ```ts
 * cleanConfig({ theme: 'dark', width: undefined, height: null })
 * // Result: { theme: 'dark' }
 * ```
 */
export function cleanConfig<T extends Record<string, any>>(config: T): Partial<T> {
  const cleaned: Partial<T> = {};

  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined && value !== null) {
      cleaned[key as keyof T] = value;
    }
  }

  return cleaned;
}

/**
 * Validate required config properties
 *
 * @example
 * ```ts
 * validateConfig({ theme: 'dark' }, ['theme', 'locale'])
 * // Throws error: "Missing required config property: locale"
 * ```
 */
export function validateConfig<T extends Record<string, any>>(
  config: T,
  requiredProps: (keyof T)[]
): void {
  for (const prop of requiredProps) {
    if (!(prop in config) || config[prop] === undefined) {
      throw new Error(`[widgetConfigBuilder] Missing required config property: ${String(prop)}`);
    }
  }
}

// ============================================================================
// PRESET BUILDERS
// ============================================================================

/**
 * Create dark theme config
 */
export function createDarkConfig<T = Record<string, any>>(
  customConfig: Partial<T> = {}
): T & BaseTradingViewProps {
  return new WidgetConfigBuilder<T>(customConfig as Partial<T & BaseTradingViewProps>)
    .setTheme('dark')
    .setLocale(DEFAULT_LOCALE)
    .setAutosize(true)
    .build();
}

/**
 * Create light theme config
 */
export function createLightConfig<T = Record<string, any>>(
  customConfig: Partial<T> = {}
): T & BaseTradingViewProps {
  return new WidgetConfigBuilder<T>(customConfig as Partial<T & BaseTradingViewProps>)
    .setTheme('light')
    .setLocale(DEFAULT_LOCALE)
    .setAutosize(true)
    .build();
}

/**
 * Create responsive config (autosize)
 */
export function createResponsiveConfig<T = Record<string, any>>(
  customConfig: Partial<T> = {}
): T & BaseTradingViewProps {
  return new WidgetConfigBuilder<T>(customConfig as Partial<T & BaseTradingViewProps>)
    .setAutosize(true)
    .setDefaults()
    .build();
}

/**
 * Create fixed size config
 */
export function createFixedSizeConfig<T = Record<string, any>>(
  width: number | string,
  height: number | string,
  customConfig: Partial<T> = {}
): T & BaseTradingViewProps {
  return new WidgetConfigBuilder<T>(customConfig as Partial<T & BaseTradingViewProps>)
    .setDimensions(width, height)
    .setDefaults()
    .build();
}

// ============================================================================
// EXPORT
// ============================================================================

const widgetConfigBuilderUtils = {
  WidgetConfigBuilder,
  createBaseConfig,
  mergeConfigs,
  cleanConfig,
  validateConfig,
  createDarkConfig,
  createLightConfig,
  createResponsiveConfig,
  createFixedSizeConfig,
};

export default widgetConfigBuilderUtils;
