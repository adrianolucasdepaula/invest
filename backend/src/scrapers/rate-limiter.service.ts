import { Injectable, Logger } from '@nestjs/common';

/**
 * Rate Limiter Service - FASE 3
 *
 * Implementa throttling por domínio para evitar sobrecarga de scrapers
 * e bloqueios (403 Forbidden, rate limiting) de sites externos.
 *
 * Estratégia:
 * - Mantém registro do último request por domínio
 * - Aplica delay mínimo de 10000ms entre requests ao mesmo domínio (FASE 5.6)
 * - Delay por domínio (não global) permite concurrency entre domínios diferentes
 *
 * Exemplo:
 * - Request 1: fundamentus.com.br → executa imediatamente
 * - Request 2: investidor10.com.br → executa imediatamente (domínio diferente)
 * - Request 3: fundamentus.com.br → aguarda 10000ms desde Request 1
 */
@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  // Map: domínio → timestamp do último request
  private lastRequest: Map<string, number> = new Map();

  // Delay mínimo entre requests ao mesmo domínio (ms)
  private readonly MIN_DELAY_MS = 10000; // ✅ FASE 5.6: 10000ms (0.1 requests/segundo) - BRAPI free plan conservador: 1 req/10s

  /**
   * Aplica throttling para um domínio específico
   *
   * @param domain - Domínio do site (ex: "fundamentus.com.br")
   * @returns Promise que resolve após aplicar delay necessário
   */
  async throttle(domain: string): Promise<void> {
    const now = Date.now();
    const last = this.lastRequest.get(domain) || 0;
    const elapsed = now - last;

    if (elapsed < this.MIN_DELAY_MS) {
      const delay = this.MIN_DELAY_MS - elapsed;
      this.logger.debug(`[RATE LIMIT] Waiting ${delay}ms before scraping ${domain}`);
      await this.sleep(delay);
    }

    this.lastRequest.set(domain, Date.now());
    this.logger.debug(`[RATE LIMIT] Allowed request to ${domain}`);
  }

  /**
   * Extrai domínio de uma URL completa
   *
   * @param url - URL completa (ex: "https://www.fundamentus.com.br/detalhes.php?papel=PETR4")
   * @returns Domínio (ex: "fundamentus.com.br")
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove "www." prefix para normalizar
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      this.logger.warn(`Failed to parse URL: ${url}, using as-is`);
      return url;
    }
  }

  /**
   * Helper: Sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna estatísticas de rate limiting (debug)
   */
  getStats(): { domain: string; lastRequest: number; elapsedMs: number }[] {
    const now = Date.now();
    return Array.from(this.lastRequest.entries()).map(([domain, timestamp]) => ({
      domain,
      lastRequest: timestamp,
      elapsedMs: now - timestamp,
    }));
  }

  /**
   * Limpa histórico de rate limiting (útil para testes)
   */
  reset(): void {
    this.lastRequest.clear();
    this.logger.log('[RATE LIMIT] History reset');
  }
}
