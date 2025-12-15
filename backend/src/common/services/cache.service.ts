import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Extended cache interface with store access
 * cache-manager v6+ changed API - store access varies by implementation
 */
interface CacheWithStore extends Cache {
  store?: {
    reset?: () => Promise<void>;
  };
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit: ${key}`);
      } else {
        this.logger.debug(`Cache miss: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl ? ttl * 1000 : undefined);
      this.logger.debug(`Cached: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted from cache: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Clear all cache
   * Note: reset() is not available in cache-manager v6+
   * Use store-specific methods if needed
   */
  async reset(): Promise<void> {
    try {
      const cacheWithStore = this.cacheManager as CacheWithStore;
      if (cacheWithStore.store?.reset) {
        await cacheWithStore.store.reset();
        this.logger.log('Cache cleared');
      } else {
        this.logger.warn('Cache reset not supported by current store');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Cache reset error: ${errorMessage}`);
    }
  }

  /**
   * Cache with callback - get from cache or execute callback and cache result
   */
  async wrap<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      // Try to get from cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Execute callback
      const result = await callback();

      // Cache result
      await this.set(key, result, ttl);

      return result;
    } catch (error) {
      this.logger.error(`Cache wrap error for key ${key}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern (Redis specific)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // This would require access to the underlying Redis client
      // For now, just log
      this.logger.log(`Invalidating cache pattern: ${pattern}`);
      // TODO: Implement Redis SCAN and DEL for pattern matching
    } catch (error) {
      this.logger.error(`Cache invalidate pattern error: ${error.message}`);
    }
  }

  /**
   * Generate cache key
   */
  generateKey(prefix: string, ...parts: any[]): string {
    return [prefix, ...parts.map((p) => (typeof p === 'object' ? JSON.stringify(p) : p))].join(':');
  }
}
