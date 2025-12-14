import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TelemetryService } from './telemetry.service';
import { TracingInterceptor } from './tracing.interceptor';
import { TelemetryController } from './telemetry.controller';

/**
 * TelemetryModule - Módulo global de telemetria
 *
 * FASE 76.3: Distributed Tracing Completo
 * FASE 76.4: Frontend Error Reporting
 *
 * Fornece:
 * - TelemetryService para traces e métricas customizados
 * - TracingInterceptor para tracing automático de requisições
 * - TelemetryController para receber erros do frontend
 *
 * Uso:
 * 1. Importe TelemetryModule no AppModule
 * 2. Use TelemetryService para criar spans customizados
 * 3. O TracingInterceptor é registrado globalmente
 * 4. Frontend pode enviar erros para /api/v1/telemetry/frontend-error
 */
@Global()
@Module({
  controllers: [TelemetryController],
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
