import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Not, IsNull } from 'typeorm';
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
 * FASE 90: Resultado de saveEvents com contagem precisa
 */
interface SaveEventsResult {
  inserted: number;
  updated: number;
  skipped: number;
  events: EconomicEvent[];
}

/**
 * FASE 90: Configuração de séries BCB para o calendário econômico
 * Documentação: https://www3.bcb.gov.br/sgspub/
 */
interface BCBSeriesConfig {
  code: number;
  name: string;
  nameEn: string;
  category: EventCategory;
  importance: EventImportance;
  unit: string;
  frequency: 'daily' | 'monthly';
}

/**
 * FASE 90: Séries BCB corretas
 * - 433: IPCA (variação mensal) - valores típicos: 0.1% a 1.5%
 * - 432: SELIC (taxa meta) - valores típicos: 10% a 15%
 * - 7478: IPCA-15 (prévia do IPCA) - valores típicos: 0.1% a 1.5%
 */
const BCB_SERIES: BCBSeriesConfig[] = [
  {
    code: 433,
    name: 'IPCA - Variação Mensal',
    nameEn: 'IPCA - Monthly Change',
    category: EventCategory.INFLATION,
    importance: EventImportance.HIGH,
    unit: '%',
    frequency: 'monthly',
  },
  {
    code: 432,
    name: 'SELIC - Taxa Meta',
    nameEn: 'SELIC - Target Rate',
    category: EventCategory.INTEREST_RATE,
    importance: EventImportance.HIGH,
    unit: '% a.a.',
    frequency: 'daily',
  },
  {
    code: 7478,
    name: 'IPCA-15 - Variação Mensal',
    nameEn: 'IPCA-15 - Monthly Change (Preview)',
    category: EventCategory.INFLATION,
    importance: EventImportance.HIGH,
    unit: '%',
    frequency: 'monthly',
  },
];

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
   * FASE 91: Busca eventos FUTUROS (agenda de próximas divulgações)
   * Eventos com eventDate > now, ordenados por data crescente
   */
  async getUpcomingEvents(limit = 10): Promise<EconomicEvent[]> {
    const now = new Date();
    return this.eventRepository.find({
      where: {
        eventDate: MoreThanOrEqual(now),
      },
      order: { eventDate: 'ASC' },
      take: limit,
    });
  }

  /**
   * FASE 91: Busca eventos PASSADOS com resultados (histórico de divulgações)
   * Eventos com eventDate < now que já têm valor 'actual'
   */
  async getRecentResults(limit = 10): Promise<EconomicEvent[]> {
    const now = new Date();
    return this.eventRepository.find({
      where: {
        eventDate: LessThanOrEqual(now),
        actual: Not(IsNull()),
      },
      order: { eventDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * FASE 90: Coleta eventos do Investing.com com headers melhorados
   */
  async collectFromInvesting(): Promise<SaveEventsResult> {
    this.logger.log('Collecting economic events from Investing.com...');

    try {
      // URL do calendário econômico Investing.com
      const url = 'https://br.investing.com/economic-calendar/Service/getCalendarFilteredData';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // FASE 91: Headers ultra-realistas para evitar bloqueio
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: '*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Origin: 'https://br.investing.com',
          Referer: 'https://br.investing.com/economic-calendar/',
          // FASE 91: Fingerprint headers para bypassar detecção de bot
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
        },
        body: new URLSearchParams({
          country: '32,17', // Brasil (32) e EUA (17)
          importance: '2,3', // Média e Alta
          timeZone: '55', // FASE 90 FIX: GMT-3 (Brasília) - era '12' incorretamente
          timeFilter: 'timeRemain',
          currentTab: 'thisWeek',
        }),
        signal: AbortSignal.timeout(30000),
      });

      // FASE 90: Detectar bloqueio
      if (response.status === 403) {
        this.logger.warn('Investing.com: Access forbidden (possible bot detection)');
        return { inserted: 0, updated: 0, skipped: 0, events: [] };
      }

      if (!response.ok) {
        throw new Error(`Investing.com API error: ${response.status}`);
      }

      // FASE 90: Tentar JSON, fallback para HTML
      const responseText = await response.text();
      this.logger.debug(`Investing.com response length: ${responseText.length}`);

      // Detectar captcha
      if (responseText.includes('captcha') || responseText.includes('challenge')) {
        this.logger.warn('Investing.com: Captcha/challenge detected');
        return { inserted: 0, updated: 0, skipped: 0, events: [] };
      }

      let data: { data?: string };
      try {
        data = JSON.parse(responseText);
      } catch {
        this.logger.debug('Investing.com: Response is not JSON, treating as HTML');
        data = { data: responseText };
      }

      // Verificar resposta vazia
      if (!data.data || data.data.length < 100) {
        this.logger.warn('Investing.com: Empty or minimal response');
        return { inserted: 0, updated: 0, skipped: 0, events: [] };
      }

      const events = this.parseInvestingEvents(data);
      const saved = await this.saveEvents(events);
      this.logger.log(`Investing.com: ${saved.inserted} new, ${saved.updated} updated`);
      return saved;
    } catch (error) {
      this.logger.error(`Error collecting from Investing.com: ${error.message}`);
      return { inserted: 0, updated: 0, skipped: 0, events: [] };
    }
  }

  /**
   * FASE 90: Parseia eventos do Investing.com com múltiplos patterns
   */
  private parseInvestingEvents(data: { data?: string }): CollectedEvent[] {
    const events: CollectedEvent[] = [];

    if (!data.data) {
      this.logger.warn('Investing.com: No data field');
      return events;
    }

    const html = data.data;

    // FASE 90: Múltiplos patterns para diferentes formatos do Investing.com
    const eventPatterns = [
      /<tr[^>]*id="eventRow[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
      /<tr[^>]*data-event-datetime="[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
      /<tr[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi,
    ];

    for (const pattern of eventPatterns) {
      let match;
      let iterations = 0;
      const MAX_ITERATIONS = 100; // Prevenir loop infinito

      while ((match = pattern.exec(html)) !== null && iterations < MAX_ITERATIONS) {
        iterations++;
        try {
          const row = match[1];

          // Extrair dados do evento com múltiplos patterns
          const dateMatch =
            row.match(/data-event-datetime="([^"]+)"/) || row.match(/datetime="([^"]+)"/);
          const nameMatch =
            row.match(/class="event"[^>]*>([^<]+)</) ||
            row.match(/class="[^"]*eventName[^"]*"[^>]*>([^<]+)</);
          const countryMatch =
            row.match(/class="flagCur[^"]*"\s+title="([^"]+)"/) ||
            row.match(/title="([^"]+)"[^>]*class="[^"]*flag/);
          const impactMatch =
            row.match(/sentiment\s+(bull\d+)/) ||
            row.match(/class="[^"]*grayFullBullishIcon[^"]*"/) ||
            row.match(/data-img_key="bull(\d+)"/);
          const actualMatch =
            row.match(/class="[^"]*act[^"]*"[^>]*>([^<]*)/) ||
            row.match(/id="[^"]*actual[^"]*"[^>]*>([^<]*)/);
          const forecastMatch =
            row.match(/class="[^"]*fore[^"]*"[^>]*>([^<]*)/) ||
            row.match(/id="[^"]*forecast[^"]*"[^>]*>([^<]*)/);
          const previousMatch =
            row.match(/class="[^"]*prev[^"]*"[^>]*>([^<]*)/) ||
            row.match(/id="[^"]*previous[^"]*"[^>]*>([^<]*)/);

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

      // Se encontrou eventos com este pattern, não tenta os outros
      if (events.length > 0) break;
    }

    this.logger.debug(`Investing.com: Parsed ${events.length} events`);
    return events;
  }

  /**
   * FASE 90: Coleta eventos do BCB (Banco Central do Brasil) com múltiplas séries
   */
  async collectFromBCB(): Promise<SaveEventsResult> {
    this.logger.log('Collecting economic events from BCB...');
    const allEvents: CollectedEvent[] = [];

    try {
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      const formatDate = (d: Date) =>
        `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

      // FASE 90: Iterar por todas as séries BCB configuradas
      for (const series of BCB_SERIES) {
        try {
          const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series.code}/dados?formato=json&dataInicial=${formatDate(oneYearAgo)}&dataFinal=${formatDate(now)}`;

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)',
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(30000),
          });

          // Edge case: API indisponível
          if (!response.ok) {
            this.logger.warn(`BCB API error for series ${series.code}: ${response.status}`);
            continue;
          }

          const data = await response.json();

          // Edge case: Dados vazios
          if (!Array.isArray(data) || data.length === 0) {
            this.logger.log(`BCB series ${series.code}: No data returned`);
            continue;
          }

          const events = this.parseBCBSeriesEvents(data, series);
          allEvents.push(...events);

          this.logger.debug(
            `Collected ${events.length} events from BCB series ${series.code} (${series.name})`,
          );
        } catch (error) {
          // Edge case: Timeout ou erro de rede
          if (error.name === 'AbortError') {
            this.logger.warn(`BCB series ${series.code}: Request timeout`);
          } else {
            this.logger.error(`BCB series ${series.code}: ${error.message}`);
          }
          continue;
        }
      }

      const saved = await this.saveEvents(allEvents);
      this.logger.log(`BCB: ${saved.inserted} new, ${saved.updated} updated`);
      return saved;
    } catch (error) {
      this.logger.error(`Error collecting from BCB: ${error.message}`);
      return { inserted: 0, updated: 0, skipped: 0, events: [] };
    }
  }

  /**
   * FASE 90: Parseia eventos de uma série BCB específica
   */
  private parseBCBSeriesEvents(
    data: Array<{ data: string; valor: string }>,
    series: BCBSeriesConfig,
  ): CollectedEvent[] {
    // Para séries diárias (SELIC), pegar apenas quando valor muda
    // Para séries mensais (IPCA), pegar últimos 12 meses
    const entries =
      series.frequency === 'daily' ? this.getLastDistinctValues(data, 12) : data.slice(-12);

    return entries
      .map((item) => {
        // Edge case: Formato data inválido
        let eventDate: Date;
        try {
          eventDate = this.parseBRDate(item.data);
          if (isNaN(eventDate.getTime())) {
            this.logger.debug(`Invalid date format: ${item.data}`);
            return null;
          }
        } catch {
          this.logger.debug(`Failed to parse date: ${item.data}`);
          return null;
        }

        // Edge case: Valor não numérico
        const actualValue = parseFloat(item.valor);
        if (isNaN(actualValue)) {
          this.logger.debug(`Invalid value for ${series.name}: ${item.valor}`);
          return null;
        }

        return {
          name: series.name,
          nameEn: series.nameEn,
          country: 'BRA',
          importance: series.importance,
          category: series.category,
          eventDate,
          isAllDay: true,
          actual: actualValue,
          unit: series.unit,
          source: EventSource.BCB,
          sourceId: String(series.code),
          sourceUrl: `https://www.bcb.gov.br/estatisticas/detalhamentoSeriesTxt?codigoSerie=${series.code}`,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }

  /**
   * FASE 91: Para séries diárias, pega apenas valores distintos (quando muda)
   * IMPORTANTE: Usa a PRIMEIRA data onde cada valor apareceu (data da decisão COPOM),
   * não a data mais recente. Isso evita duplicação de eventos ao sincronizar.
   */
  private getLastDistinctValues(
    data: Array<{ data: string; valor: string }>,
    maxEntries: number,
  ): Array<{ data: string; valor: string }> {
    // FASE 91: Mapa para guardar a PRIMEIRA ocorrência de cada valor
    // Key = valor, Value = {data, valor} da primeira vez que apareceu
    const firstOccurrence = new Map<string, { data: string; valor: string }>();

    // Iterar do INÍCIO (mais antigo) para o FIM (mais recente)
    // Assim capturamos a PRIMEIRA data onde cada valor apareceu
    for (const item of data) {
      if (!firstOccurrence.has(item.valor)) {
        firstOccurrence.set(item.valor, item);
      }
    }

    // Converter para array e pegar os N mais recentes (por ordem de aparecimento)
    const allDistinct = Array.from(firstOccurrence.values());

    // Retornar os últimos N valores distintos (mais recentes em termos de mudança)
    return allDistinct.slice(-maxEntries);
  }

  /**
   * FASE 90: Coleta todos os eventos de todas as fontes com contagem precisa
   */
  async collectAll(): Promise<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    bySource: Record<EventSource, number>;
  }> {
    const results = await Promise.allSettled([this.collectFromInvesting(), this.collectFromBCB()]);

    const bySource: Record<EventSource, number> = {
      [EventSource.INVESTING]: 0,
      [EventSource.FRED]: 0,
      [EventSource.BCB]: 0,
      [EventSource.ANBIMA]: 0,
      [EventSource.IBGE]: 0,
      [EventSource.OTHER]: 0,
    };

    let total = 0;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        inserted += result.value.inserted || 0;
        updated += result.value.updated || 0;
        skipped += result.value.skipped || 0;

        // Contar apenas eventos inseridos e atualizados por fonte
        for (const event of result.value.events || []) {
          bySource[event.source]++;
          total++;
        }
      }
    }

    return { total, inserted, updated, skipped, bySource };
  }

  /**
   * FASE 90: Salva eventos no banco com contagem precisa
   */
  private async saveEvents(events: CollectedEvent[]): Promise<SaveEventsResult> {
    const result: SaveEventsResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      events: [],
    };

    // FASE 90: Batch processing para evitar timeout
    const BATCH_SIZE = 50;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);

      for (const event of batch) {
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
            // FASE 90 FIX: Atualizar apenas se actual mudou e não é null
            const needsUpdate =
              event.actual !== undefined &&
              event.actual !== null &&
              !isNaN(Number(event.actual)) &&
              Number(event.actual) !== Number(existing.actual);

            if (needsUpdate) {
              existing.actual = event.actual;
              // Atualizar forecast/previous apenas se novos valores existem
              if (event.forecast !== undefined && event.forecast !== null) {
                existing.forecast = event.forecast;
              }
              if (event.previous !== undefined && event.previous !== null) {
                existing.previous = event.previous;
              }
              const updated = await this.eventRepository.save(existing);
              result.updated++;
              result.events.push(updated);
              this.logger.debug(`Updated event: ${event.name} (${event.eventDate})`);
            } else {
              // FASE 90 FIX: NÃO adiciona ao result.events se não houve alteração
              result.skipped++;
            }
          } else {
            // FASE 90: Tentar insert, catch duplicate key
            try {
              const newEvent = this.eventRepository.create(event);
              const savedEvent = await this.eventRepository.save(newEvent);
              result.inserted++;
              result.events.push(savedEvent);
              this.logger.debug(`Inserted event: ${event.name} (${event.eventDate})`);
            } catch (insertError) {
              // Edge case: Duplicate key - tratar como skip
              if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                this.logger.debug(`Duplicate detected, treating as skip: ${event.name}`);
                result.skipped++;
              } else {
                throw insertError;
              }
            }
          }
        } catch (error) {
          // Edge case: Database error
          this.logger.error(`Error saving event ${event.name}: ${error.message}`);
          // Continua com próximo evento
        }
      }
    }

    return result;
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
