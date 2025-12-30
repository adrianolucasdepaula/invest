import { Module } from '@nestjs/common';
import { DiskLifecycleController } from './disk-lifecycle.controller';
import { DiskLifecycleService } from './disk-lifecycle.service';

/**
 * FASE 146: Webhooks Module
 *
 * Gerencia webhooks externos, incluindo:
 * - Disk Lifecycle Management (Prometheus alerting)
 * - Future: Payment webhooks, Third-party integrations, etc.
 */
@Module({
  controllers: [DiskLifecycleController],
  providers: [DiskLifecycleService],
  exports: [DiskLifecycleService], // Export service for potential use in other modules
})
export class WebhooksModule {}
