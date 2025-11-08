import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IoRedisStore } from '@tirke/node-cache-manager-ioredis';
import { CacheService } from './services/cache.service';
import { NotificationsService } from './services/notifications.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: IoRedisStore.create({
          store: IoRedisStore,
          instanceConfig: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
          },
          ttl: 300, // Default TTL in seconds
        }),
      }),
    }),
  ],
  providers: [CacheService, NotificationsService],
  exports: [CacheService, NotificationsService],
})
export class CommonModule {}
