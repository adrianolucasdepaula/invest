import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Cache decorator for controller methods
 * @param key - Cache key prefix
 * @param ttl - Time to live in seconds (default: 300)
 */
export const CacheKey = (key: string, ttl: number = 300) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    return descriptor;
  };
};
