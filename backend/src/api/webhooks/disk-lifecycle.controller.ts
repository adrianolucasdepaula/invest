import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DiskLifecycleService } from './disk-lifecycle.service';

/**
 * FASE 146: Disk Lifecycle Management - Webhook Receiver
 *
 * Recebe alertas do Prometheus quando o espaço em disco atinge thresholds críticos
 * e dispara limpezas automatizadas em 3 níveis de severidade (Tier 1, 2, 3).
 *
 * Thresholds:
 * - WARNING (<20% free): Tier 1 cleanup (logs, temp, cache) ~10-20GB
 * - CRITICAL (<10% free): Tier 2 cleanup (volumes, archives) ~50-100GB
 * - EMERGENCY (<5% free): Tier 3 shutdown preventivo + backup
 */

interface PrometheusAlert {
  status: 'firing' | 'resolved';
  labels: {
    alertname: string;
    severity: string;
    tier: string;
    service: string;
    environment: string;
  };
  annotations: {
    summary: string;
    description: string;
    webhook_url?: string;
  };
  startsAt: string;
  endsAt: string;
  generatorURL: string;
  fingerprint: string;
}

interface PrometheusWebhookPayload {
  receiver: string;
  status: string;
  alerts: PrometheusAlert[];
  groupLabels: Record<string, string>;
  commonLabels: Record<string, string>;
  commonAnnotations: Record<string, string>;
  externalURL: string;
  version: string;
  groupKey: string;
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class DiskLifecycleController {
  private readonly logger = new Logger(DiskLifecycleController.name);

  constructor(private readonly diskLifecycleService: DiskLifecycleService) {}

  /**
   * Webhook endpoint para receber alertas de disco do Prometheus
   *
   * @param payload - Payload do Prometheus Alertmanager
   * @returns Status da operação
   */
  @Post('disk-cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disk Cleanup Webhook',
    description: `
      Recebe alertas do Prometheus sobre espaço em disco baixo e dispara limpezas automatizadas.

      **Tiers de Limpeza:**
      - **Tier 1 (WARNING <20%)**: Limpeza leve (~10-20GB) - logs, temp, cache
      - **Tier 2 (CRITICAL <10%)**: Limpeza agressiva (~50-100GB) - volumes, archives
      - **Tier 3 (EMERGENCY <5%)**: Shutdown preventivo + backup

      **Payload esperado do Prometheus Alertmanager:**
      - \`status\`: "firing" | "resolved"
      - \`alerts[].labels.tier\`: "tier1" | "tier2" | "tier3"
      - \`alerts[].labels.severity\`: "warning" | "critical" | "emergency"
    `,
  })
  @ApiBody({
    description: 'Prometheus Alertmanager webhook payload',
    schema: {
      type: 'object',
      properties: {
        receiver: { type: 'string', example: 'disk-cleanup-webhook' },
        status: { type: 'string', example: 'firing', enum: ['firing', 'resolved'] },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'firing' },
              labels: {
                type: 'object',
                properties: {
                  alertname: { type: 'string', example: 'DiskSpaceWarning' },
                  severity: { type: 'string', example: 'warning' },
                  tier: { type: 'string', example: 'tier1' },
                  service: { type: 'string', example: 'disk-lifecycle' },
                  environment: { type: 'string', example: 'production' },
                },
              },
              annotations: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook recebido e processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'acknowledged' },
        tier: { type: 'string', example: 'tier1' },
        alertsProcessed: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Cleanup tier1 initiated for 1 alert(s)' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload inválido',
  })
  async handleDiskCleanupWebhook(@Body() payload: PrometheusWebhookPayload) {
    this.logger.log(`Webhook received: ${payload.status} - ${payload.alerts.length} alert(s)`);

    // Log payload for debugging
    this.logger.debug(`Webhook payload: ${JSON.stringify(payload, null, 2)}`);

    // Process only firing alerts
    const firingAlerts = payload.alerts.filter((alert) => alert.status === 'firing');

    if (firingAlerts.length === 0) {
      this.logger.log('No firing alerts to process (all resolved)');
      return {
        status: 'acknowledged',
        tier: null,
        alertsProcessed: 0,
        message: 'No firing alerts to process',
      };
    }

    // Process each firing alert
    const results = await Promise.allSettled(
      firingAlerts.map(async (alert) => {
        const tier = alert.labels.tier;
        const severity = alert.labels.severity;
        const alertName = alert.labels.alertname;

        this.logger.warn(`Processing alert: ${alertName} | Severity: ${severity} | Tier: ${tier}`);

        // Execute cleanup based on tier
        await this.diskLifecycleService.executeCleanup(tier, {
          alertName,
          severity,
          summary: alert.annotations.summary,
          description: alert.annotations.description,
          startsAt: alert.startsAt,
          fingerprint: alert.fingerprint,
        });

        return { tier, severity, alertName };
      }),
    );

    // Count successful and failed cleanups
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      this.logger.error(
        `Webhook processing completed with errors: ${successful} succeeded, ${failed} failed`,
      );
    } else {
      this.logger.log(
        `Webhook processing completed successfully: ${successful} alert(s) processed`,
      );
    }

    return {
      status: 'acknowledged',
      tier: firingAlerts[0]?.labels.tier || null,
      alertsProcessed: successful,
      message: `Cleanup initiated for ${successful} alert(s)`,
    };
  }
}
