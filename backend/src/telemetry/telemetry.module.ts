import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TelemetryService } from './telemetry.service';
import { TracingInterceptor } from './tracing.interceptor';

/**
 * TelemetryModule - Módulo global de telemetria
 *
 * FASE 76.3: Distributed Tracing Completo
 *
 * Fornece:
 * - TelemetryService para traces e métricas customizados
 * - TracingInterceptor para tracing automático de requisições
 *
 * Uso:
 * 1. Importe TelemetryModule no AppModule
 * 2. Use TelemetryService para criar spans customizados
 * 3. O TracingInterceptor é registrado globalmente
 */
@Global()
@Module({
  providers: [
    TelemetryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
  exports: [TelemetryService],
})
export class TelemetryModule {}
