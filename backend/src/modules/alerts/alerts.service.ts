import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Alert, AlertStatus, AlertType, NotificationChannel } from '../../database/entities';

export interface CreateAlertDto {
  userId: string;
  assetId?: string;
  type: AlertType;
  targetValue: number;
  notificationChannels: NotificationChannel[];
  message?: string;
}

export interface UpdateAlertDto {
  targetValue?: number;
  notificationChannels?: NotificationChannel[];
  message?: string;
  status?: AlertStatus;
}

export interface AlertCheckResult {
  alert: Alert;
  triggered: boolean;
  currentValue?: number;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async create(dto: CreateAlertDto): Promise<Alert> {
    this.logger.log(`Creating alert for user ${dto.userId}, type: ${dto.type}`);

    const alert = this.alertRepository.create({
      userId: dto.userId,
      assetId: dto.assetId,
      type: dto.type,
      targetValue: dto.targetValue,
      notificationChannels: dto.notificationChannels,
      message: dto.message,
      status: AlertStatus.ACTIVE,
    });

    const saved = await this.alertRepository.save(alert);
    this.logger.log(`Alert created: ${saved.id}`);
    return saved;
  }

  async findById(id: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: ['user', 'asset'],
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${id} not found`);
    }

    return alert;
  }

  async findByUser(userId: string, status?: AlertStatus): Promise<Alert[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.alertRepository.find({
      where,
      relations: ['asset'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAsset(assetId: string, status?: AlertStatus): Promise<Alert[]> {
    const where: any = { assetId };
    if (status) {
      where.status = status;
    }

    return this.alertRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveAlerts(): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { status: AlertStatus.ACTIVE },
      relations: ['user', 'asset'],
    });
  }

  async update(id: string, dto: UpdateAlertDto): Promise<Alert> {
    const alert = await this.findById(id);

    if (dto.targetValue !== undefined) {
      alert.targetValue = dto.targetValue;
    }
    if (dto.notificationChannels) {
      alert.notificationChannels = dto.notificationChannels;
    }
    if (dto.message !== undefined) {
      alert.message = dto.message;
    }
    if (dto.status) {
      alert.status = dto.status;
    }

    return this.alertRepository.save(alert);
  }

  async delete(id: string): Promise<void> {
    const alert = await this.findById(id);
    await this.alertRepository.remove(alert);
    this.logger.log(`Alert deleted: ${id}`);
  }

  async triggerAlert(id: string, currentValue: number): Promise<Alert> {
    const alert = await this.findById(id);

    alert.status = AlertStatus.TRIGGERED;
    alert.triggeredAt = new Date();
    alert.lastCheckedAt = new Date();
    alert.currentValue = currentValue;
    alert.triggerCount = (alert.triggerCount || 0) + 1;

    this.logger.log(
      `Alert triggered: ${id}, target: ${alert.targetValue}, current: ${currentValue}`,
    );

    return this.alertRepository.save(alert);
  }

  async checkPriceAlerts(assetId: string, currentPrice: number): Promise<AlertCheckResult[]> {
    const alerts = await this.alertRepository.find({
      where: {
        assetId,
        status: AlertStatus.ACTIVE,
        type: LessThanOrEqual(AlertType.PRICE_CHANGE_PERCENT) as any,
      },
      relations: ['user', 'asset'],
    });

    const results: AlertCheckResult[] = [];

    for (const alert of alerts) {
      let triggered = false;

      switch (alert.type) {
        case AlertType.PRICE_ABOVE:
          triggered = currentPrice >= alert.targetValue;
          break;
        case AlertType.PRICE_BELOW:
          triggered = currentPrice <= alert.targetValue;
          break;
        case AlertType.PRICE_CHANGE_PERCENT:
          // Requires baseline price to calculate percentage change
          // This would need additional logic with historical data
          break;
      }

      if (triggered) {
        await this.triggerAlert(alert.id, currentPrice);
      }

      alert.lastCheckedAt = new Date();
      alert.currentValue = currentPrice;
      await this.alertRepository.save(alert);

      results.push({ alert, triggered, currentValue: currentPrice });
    }

    return results;
  }

  async getStats(userId?: string): Promise<{
    total: number;
    active: number;
    triggered: number;
    paused: number;
    expired: number;
    byType: Record<string, number>;
  }> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const alerts = await this.alertRepository.find({ where });

    const stats = {
      total: alerts.length,
      active: 0,
      triggered: 0,
      paused: 0,
      expired: 0,
      byType: {} as Record<string, number>,
    };

    for (const alert of alerts) {
      switch (alert.status) {
        case AlertStatus.ACTIVE:
          stats.active++;
          break;
        case AlertStatus.TRIGGERED:
          stats.triggered++;
          break;
        case AlertStatus.PAUSED:
          stats.paused++;
          break;
        case AlertStatus.EXPIRED:
          stats.expired++;
          break;
      }

      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    }

    return stats;
  }

  async pauseAlert(id: string): Promise<Alert> {
    return this.update(id, { status: AlertStatus.PAUSED });
  }

  async resumeAlert(id: string): Promise<Alert> {
    return this.update(id, { status: AlertStatus.ACTIVE });
  }

  async expireOldAlerts(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.alertRepository.update(
      {
        status: AlertStatus.ACTIVE,
        createdAt: LessThanOrEqual(cutoffDate),
      },
      { status: AlertStatus.EXPIRED },
    );

    const affected = result.affected || 0;
    if (affected > 0) {
      this.logger.log(`Expired ${affected} old alerts`);
    }

    return affected;
  }
}
