import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.generateCacheKey(cacheKey, request);

    try {
      // Try to get from cache
      const cachedResponse = await this.cacheManager.get(fullCacheKey);

      if (cachedResponse) {
        this.logger.debug(`Cache hit for key: ${fullCacheKey}`);
        return of(cachedResponse);
      }

      this.logger.debug(`Cache miss for key: ${fullCacheKey}`);

      // If not in cache, execute handler and cache result
      return next.handle().pipe(
        tap(async (response) => {
          try {
            await this.cacheManager.set(fullCacheKey, response, cacheTTL * 1000);
            this.logger.debug(`Cached response for key: ${fullCacheKey} (TTL: ${cacheTTL}s)`);
          } catch (error) {
            this.logger.error(`Failed to cache response: ${error.message}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error: ${error.message}`);
      return next.handle();
    }
  }

  private generateCacheKey(prefix: string, request: any): string {
    const params = request.params || {};
    const query = request.query || {};
    const userId = request.user?.id || 'anonymous';

    const paramsStr = Object.keys(params).length ? ':' + Object.values(params).join(':') : '';
    const queryStr = Object.keys(query).length ? ':' + JSON.stringify(query) : '';

    return `${prefix}:${userId}${paramsStr}${queryStr}`;
  }
}
