import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export enum NotificationType {
  PRICE_ALERT = 'price_alert',
  ANALYSIS_COMPLETE = 'analysis_complete',
  REPORT_READY = 'report_ready',
  PORTFOLIO_UPDATE = 'portfolio_update',
  SCRAPING_FAILED = 'scraping_failed',
  RECOMMENDATION = 'recommendation',
}

export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  userId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly emailEnabled: boolean;
  private readonly telegramEnabled: boolean;
  private readonly telegramBotToken: string;
  private readonly telegramChatId: string;

  constructor(private configService: ConfigService) {
    this.emailEnabled = this.configService.get('EMAIL_ENABLED', false);
    this.telegramEnabled = this.configService.get('TELEGRAM_ENABLED', false);
    this.telegramBotToken = this.configService.get('TELEGRAM_BOT_TOKEN', '');
    this.telegramChatId = this.configService.get('TELEGRAM_CHAT_ID', '');
  }

  /**
   * Send notification
   */
  async send(notification: Notification): Promise<void> {
    this.logger.log(`Sending notification: ${notification.type} - ${notification.title}`);

    try {
      const promises = [];

      // Send to Telegram if enabled
      if (this.telegramEnabled) {
        promises.push(this.sendTelegram(notification));
      }

      // Send to Email if enabled
      if (this.emailEnabled) {
        promises.push(this.sendEmail(notification));
      }

      // TODO: Send push notification, WebSocket, etc.

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegram(notification: Notification): Promise<void> {
    if (!this.telegramBotToken || !this.telegramChatId) {
      return;
    }

    try {
      const text = this.formatTelegramMessage(notification);

      await axios.post(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
        chat_id: this.telegramChatId,
        text,
        parse_mode: 'HTML',
      });

      this.logger.log('Telegram notification sent');
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification: ${error.message}`);
    }
  }

  /**
   * Send Email notification
   */
  private async sendEmail(_notification: Notification): Promise<void> {
    // TODO: Implement email sending
    this.logger.log('Email notification sent (not implemented)');
  }

  /**
   * Format Telegram message
   */
  private formatTelegramMessage(notification: Notification): string {
    let icon = '📢';

    switch (notification.type) {
      case NotificationType.PRICE_ALERT:
        icon = '💰';
        break;
      case NotificationType.ANALYSIS_COMPLETE:
        icon = '✅';
        break;
      case NotificationType.REPORT_READY:
        icon = '📊';
        break;
      case NotificationType.PORTFOLIO_UPDATE:
        icon = '💼';
        break;
      case NotificationType.SCRAPING_FAILED:
        icon = '⚠️';
        break;
      case NotificationType.RECOMMENDATION:
        icon = '🎯';
        break;
    }

    let message = `${icon} <b>${notification.title}</b>\n\n${notification.message}`;

    if (notification.data) {
      message += '\n\n<i>Detalhes:</i>\n';
      message += this.formatData(notification.data);
    }

    return message;
  }

  /**
   * Format notification data
   */
  private formatData(data: any): string {
    const lines = [];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object') {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Send price alert
   */
  async sendPriceAlert(ticker: string, currentPrice: number, targetPrice: number): Promise<void> {
    await this.send({
      type: NotificationType.PRICE_ALERT,
      title: `Alerta de Preço - ${ticker}`,
      message: `O ativo ${ticker} atingiu R$ ${currentPrice.toFixed(2)}!`,
      data: {
        ticker,
        currentPrice: `R$ ${currentPrice.toFixed(2)}`,
        targetPrice: `R$ ${targetPrice.toFixed(2)}`,
      },
    });
  }

  /**
   * Send analysis complete notification
   */
  async sendAnalysisComplete(ticker: string, recommendation: string): Promise<void> {
    await this.send({
      type: NotificationType.ANALYSIS_COMPLETE,
      title: `Análise Concluída - ${ticker}`,
      message: `A análise de ${ticker} foi concluída.`,
      data: {
        ticker,
        recommendation,
      },
    });
  }

  /**
   * Send report ready notification
   */
  async sendReportReady(ticker: string): Promise<void> {
    await this.send({
      type: NotificationType.REPORT_READY,
      title: `Relatório Pronto - ${ticker}`,
      message: `O relatório completo de ${ticker} está disponível.`,
      data: {
        ticker,
      },
    });
  }

  /**
   * Send portfolio update notification
   */
  async sendPortfolioUpdate(portfolioName: string, change: number): Promise<void> {
    const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';

    await this.send({
      type: NotificationType.PORTFOLIO_UPDATE,
      title: `Atualização de Portfólio`,
      message: `${emoji} ${portfolioName}: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
      data: {
        portfolio: portfolioName,
        change: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
      },
    });
  }

  /**
   * Send recommendation notification
   */
  async sendRecommendation(
    ticker: string,
    action: string,
    confidence: number,
    reason: string,
  ): Promise<void> {
    let actionEmoji = '🤔';

    if (action === 'STRONG_BUY' || action === 'BUY') {
      actionEmoji = '🟢';
    } else if (action === 'SELL' || action === 'STRONG_SELL') {
      actionEmoji = '🔴';
    } else {
      actionEmoji = '🟡';
    }

    await this.send({
      type: NotificationType.RECOMMENDATION,
      title: `Recomendação - ${ticker}`,
      message: `${actionEmoji} ${action} (${confidence}% confiança)\n\n${reason}`,
      data: {
        ticker,
        action,
        confidence: `${confidence}%`,
      },
    });
  }
}
