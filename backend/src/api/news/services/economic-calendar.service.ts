import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  EconomicEvent,
  EventImportance,
  EventCategory,
  EventSource,
} from '../../../database/entities';

/**
 * Evento coletado (antes de salvar no banco)
 */
interface CollectedEvent {
  name: string;
  nameEn?: string;
  country: string;
  importance: EventImportance;
  category: EventCategory;
  eventDate: Date;
  isAllDay: boolean;
  actual?: number;
  forecast?: number;
  previous?: number;
  unit?: string;
  impactDirection?: 'positive' | 'negative' | 'neutral' | null;
  source: EventSource;
  sourceId?: string;
  sourceUrl?: string;
  description?: string;
}

/**
 * FASE 75.7: Economic Calendar Service
 *
 * Coleta e gerencia eventos do calendário econômico de múltiplas fontes:
 * - Investing.com
 * - FRED (Federal Reserve Economic Data)
 * - BCB (Banco Central do Brasil)
 * - ANBIMA
 * - IBGE
 */
@Injectable()
export class EconomicCalendarService {
  private readonly logger = new Logger(EconomicCalendarService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(EconomicEvent)
    private readonly eventRepository: Repository<EconomicEvent>,
  ) {}

  /**
   * Busca eventos em um período
   */
  async findEvents(options: {
    startDate?: Date;
    endDate?: Date;
    country?: string;
    importance?: EventImportance;
    category?: EventCategory;
    limit?: number;
  }): Promise<EconomicEvent[]> {
    const where: Record<string, unknown> = {};

    if (options.startDate && options.endDate) {
      where.eventDate = Between(options.startDate, options.endDate);
    } else if (options.startDate) {
      where.eventDate = MoreThanOrEqual(options.startDate);
    } else if (options.endDate) {
      where.eventDate = LessThanOrEqual(options.endDate);
    }

    if (options.country) {
      where.country = options.country;
    }

    if (options.importance) {
      where.importance = options.importance;
    }

    if (options.category) {
      where.category = options.category;
    }

    return this.eventRepository.find({
      where,
      order: { eventDate: 'ASC' },
      take: options.limit || 100,
    });
  }

  /**
   * Busca eventos da semana atual
   */
  async getWeekEvents(country?: string): Promise<EconomicEvent[]> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.findEvents({
      startDate: startOfWeek,
      endDate: endOfWeek,
      country,
    });
  }

  /**
   * Busca eventos de alta importância (recentes + próximos)
   * Inclui eventos dos últimos 7 dias e futuros
   */
  async getUpcomingHighImpact(limit = 10): Promise<EconomicEvent[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.findEvents({
      startDate: sevenDaysAgo,
      importance: EventImportance.HIGH,
      limit,
    });
  }

  /**
   * Coleta eventos do Investing.com
   */
  async collectFromInvesting(): Promise<EconomicEvent[]> {
    this.logger.log('Collecting economic events from Investing.com...');

    try {
      // URL do calendário econômico Investing.com
      const url = 'https://br.investing.com/economic-calendar/Service/getCalendarFilteredData';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({
          country: '32,17', // Brasil (32) e EUA (17)
          importance: '2,3', // Média e Alta
          timeZone: '12', // America/Sao_Paulo
          timeFilter: 'timeRemain',
          currentTab: 'thisWeek',
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Investing.com API error: ${response.status}`);
      }

      const data = await response.json();
      const events = this.parseInvestingEvents(data);

      // Salvar eventos
      const saved = await this.saveEvents(events);
      this.logger.log(`Collected ${saved.length} events from Investing.com`);
      return saved;
    } catch (error) {
      this.logger.error(`Error collecting from Investing.com: ${error.message}`);
      return [];
    }
  }

  /**
   * Parseia eventos do Investing.com
   */
  private parseInvestingEvents(data: { data?: string }): CollectedEvent[] {
    const events: CollectedEvent[] = [];

    if (!data.data) return events;

    // Parser simples de HTML da resposta
    const html = data.data;
    const eventRegex = /<tr[^>]*event[^>]*>([\s\S]*?)<\/tr>/g;
    let match;

    while ((match = eventRegex.exec(html)) !== null) {
      try {
        const row = match[1];

        // Extrair dados do evento
        const dateMatch = row.match(/data-event-datetime="([^"]+)"/);
        const nameMatch = row.match(/class="event"[^>]*>([^<]+)</);
        const countryMatch = row.match(/class="flagCur[^"]*"\s+title="([^"]+)"/);
        const impactMatch = row.match(/sentiment\s+(bull\d+)/);
        const actualMatch = row.match(/class="act[^"]*"[^>]*>([^<]*)</);
        const forecastMatch = row.match(/class="fore[^"]*"[^>]*>([^<]*)</);
        const previousMatch = row.match(/class="prev[^"]*"[^>]*>([^<]*)</);

        if (dateMatch && nameMatch) {
          const importance = this.parseImportance(impactMatch?.[1]);
          const country = this.parseCountry(countryMatch?.[1]);

          events.push({
            name: nameMatch[1].trim(),
            country,
            importance,
            category: this.inferCategory(nameMatch[1]),
            eventDate: new Date(dateMatch[1]),
            isAllDay: false,
            actual: this.parseNumber(actualMatch?.[1]),
            forecast: this.parseNumber(forecastMatch?.[1]),
            previous: this.parseNumber(previousMatch?.[1]),
            source: EventSource.INVESTING,
          });
        }
      } catch {
        // Ignorar eventos mal formados
      }
    }

    return events;
  }

  /**
   * Coleta eventos do BCB (Banco Central do Brasil)
   */
  async collectFromBCB(): Promise<EconomicEvent[]> {
    this.logger.log('Collecting economic events from BCB...');

    try {
      // API do BCB - SGS (Sistema Gerenciador de Séries Temporais)
      // Série 432 = IPCA mensal, requer data range (máximo 10 anos)
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const formatDate = (d: Date) =>
        `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=${formatDate(oneYearAgo)}&dataFinal=${formatDate(now)}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`BCB API error: ${response.status}`);
      }

      const data = await response.json();
      const events = this.parseBCBEvents(data);

      const saved = await this.saveEvents(events);
      this.logger.log(`Collected ${saved.length} events from BCB`);
      return saved;
    } catch (error) {
      this.logger.error(`Error collecting from BCB: ${error.message}`);
      return [];
    }
  }

  /**
   * Parseia eventos do BCB
   */
  private parseBCBEvents(data: Array<{ data: string; valor: string }>): CollectedEvent[] {
    // Últimos 10 dados de IPCA (série 432)
    return data.slice(-10).map((item) => ({
      name: 'IPCA - Variação Mensal',
      nameEn: 'IPCA - Monthly Change',
      country: 'BRA',
      importance: EventImportance.HIGH,
      category: EventCategory.INFLATION,
      eventDate: this.parseBRDate(item.data),
      isAllDay: true,
      actual: parseFloat(item.valor),
      unit: '%',
      source: EventSource.BCB,
      sourceId: '432',
    }));
  }

  /**
   * Coleta todos os eventos de todas as fontes
   */
  async collectAll(): Promise<{
    total: number;
    bySource: Record<EventSource, number>;
  }> {
    const results = await Promise.allSettled([
      this.collectFromInvesting(),
      this.collectFromBCB(),
    ]);

    const bySource: Record<EventSource, number> = {
      [EventSource.INVESTING]: 0,
      [EventSource.FRED]: 0,
      [EventSource.BCB]: 0,
      [EventSource.ANBIMA]: 0,
      [EventSource.IBGE]: 0,
      [EventSource.OTHER]: 0,
    };

    let total = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const event of result.value) {
          bySource[event.source]++;
          total++;
        }
      }
    }

    return { total, bySource };
  }

  /**
   * Salva eventos no banco
   */
  private async saveEvents(events: CollectedEvent[]): Promise<EconomicEvent[]> {
    const saved: EconomicEvent[] = [];

    for (const event of events) {
      try {
        // Verificar se já existe (por nome + data + fonte)
        const existing = await this.eventRepository.findOne({
          where: {
            name: event.name,
            eventDate: event.eventDate,
            source: event.source,
          },
        });

        if (existing) {
          // Atualizar valores se changed
          if (event.actual !== undefined && event.actual !== existing.actual) {
            existing.actual = event.actual;
            await this.eventRepository.save(existing);
          }
          saved.push(existing);
        } else {
          const newEvent = this.eventRepository.create(event);
          const savedEvent = await this.eventRepository.save(newEvent);
          saved.push(savedEvent);
        }
      } catch (error) {
        this.logger.debug(`Error saving event: ${error.message}`);
      }
    }

    return saved;
  }

  /**
   * Helpers
   */
  private parseImportance(impact?: string): EventImportance {
    if (!impact) return EventImportance.LOW;
    if (impact.includes('3')) return EventImportance.HIGH;
    if (impact.includes('2')) return EventImportance.MEDIUM;
    return EventImportance.LOW;
  }

  private parseCountry(country?: string): string {
    if (!country) return 'XXX';
    if (country.toLowerCase().includes('brasil') || country.toLowerCase().includes('brazil')) {
      return 'BRA';
    }
    if (country.toLowerCase().includes('united states') || country.toLowerCase().includes('eua')) {
      return 'USA';
    }
    return 'XXX';
  }

  private inferCategory(name: string): EventCategory {
    const lower = name.toLowerCase();
    if (lower.includes('juro') || lower.includes('selic') || lower.includes('rate')) {
      return EventCategory.INTEREST_RATE;
    }
    if (lower.includes('inflação') || lower.includes('ipca') || lower.includes('cpi')) {
      return EventCategory.INFLATION;
    }
    if (lower.includes('emprego') || lower.includes('desemprego') || lower.includes('employment')) {
      return EventCategory.EMPLOYMENT;
    }
    if (lower.includes('pib') || lower.includes('gdp')) {
      return EventCategory.GDP;
    }
    if (lower.includes('balança') || lower.includes('trade')) {
      return EventCategory.TRADE;
    }
    if (lower.includes('confiança') || lower.includes('consumer')) {
      return EventCategory.CONSUMER;
    }
    if (lower.includes('industrial') || lower.includes('manufacturing')) {
      return EventCategory.MANUFACTURING;
    }
    if (lower.includes('housing') || lower.includes('imobiliário')) {
      return EventCategory.HOUSING;
    }
    if (lower.includes('copom') || lower.includes('fomc') || lower.includes('central bank')) {
      return EventCategory.CENTRAL_BANK;
    }
    return EventCategory.OTHER;
  }

  private parseNumber(value?: string): number | undefined {
    if (!value) return undefined;
    const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  private parseBRDate(dateStr: string): Date {
    // Formato dd/mm/yyyy
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Retorna estatísticas do calendário
   */
  async getStats(): Promise<{
    total: number;
    upcoming: number;
    byImportance: Record<EventImportance, number>;
    byCategory: Record<EventCategory, number>;
  }> {
    const all = await this.eventRepository.find();
    const now = new Date();

    const byImportance: Record<EventImportance, number> = {
      [EventImportance.LOW]: 0,
      [EventImportance.MEDIUM]: 0,
      [EventImportance.HIGH]: 0,
    };

    const byCategory: Record<EventCategory, number> = {
      [EventCategory.INTEREST_RATE]: 0,
      [EventCategory.INFLATION]: 0,
      [EventCategory.EMPLOYMENT]: 0,
      [EventCategory.GDP]: 0,
      [EventCategory.TRADE]: 0,
      [EventCategory.CONSUMER]: 0,
      [EventCategory.MANUFACTURING]: 0,
      [EventCategory.HOUSING]: 0,
      [EventCategory.CENTRAL_BANK]: 0,
      [EventCategory.OTHER]: 0,
    };

    let upcoming = 0;

    for (const event of all) {
      byImportance[event.importance]++;
      byCategory[event.category]++;
      if (event.eventDate >= now) upcoming++;
    }

    return {
      total: all.length,
      upcoming,
      byImportance,
      byCategory,
    };
  }
}
