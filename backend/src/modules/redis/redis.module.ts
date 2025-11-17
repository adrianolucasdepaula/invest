import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

/**
 * RedisModule - Centralized Redis cache configuration
 *
 * Purpose:
 * - Cache COTAHIST ZIP downloads (TTL 24h)
 * - Reduce FTP bandwidth usage
 * - Improve sync performance (45s → <1s for cached data)
 *
 * Configuration:
 * - Host: REDIS_HOST env variable (default: localhost)
 * - Port: REDIS_PORT env variable (default: 6479)
 * - TTL: 86400 seconds (24 hours) for COTAHIST ZIPs
 *
 * Usage:
 * ```typescript
 * import { Inject, Injectable } from '@nestjs/common';
 * import { CACHE_MANAGER } from '@nestjs/cache-manager';
 * import { Cache } from 'cache-manager';
 *
 * @Injectable()
 * export class MyService {
 *   constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}
 *
 *   async getData(key: string) {
 *     const cached = await this.cache.get(key);
 *     if (cached) return cached;
 *
 *     const fresh = await this.fetchData();
 *     await this.cache.set(key, fresh, 86400); // TTL 24h
 *     return fresh;
 *   }
 * }
 * ```
 *
 * FASE 34.2: Redis Cache COTAHIST Downloads
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true, // Available throughout the app
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get('REDIS_HOST', 'localhost');
        const redisPort = config.get('REDIS_PORT', 6479);

        const keyv = new Keyv({
          store: new KeyvRedis(`redis://${redisHost}:${redisPort}`),
          ttl: 86400 * 1000, // 24 hours in milliseconds
        });

        return {
          store: keyv,
          ttl: 86400 * 1000, // Default TTL 24h
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
