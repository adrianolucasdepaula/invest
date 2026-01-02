import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

/**
 * DecimalTransformer - Transforma Decimal.js <-> PostgreSQL decimal
 *
 * Implementa ValueTransformer do TypeORM para garantir precisão perfeita
 * em cálculos financeiros, evitando imprecisão do JavaScript number (float64).
 *
 * **Compliance:** CLAUDE.md Financial Data Rules
 * - "✅ Decimal (não Float) para valores monetários"
 * - Evita: 0.1 + 0.2 !== 0.3 (float imprecision)
 * - Garante: new Decimal('0.1').plus('0.2').equals('0.3') === true
 *
 * **Uso em entities:**
 * ```typescript
 * import Decimal from 'decimal.js';
 * import { DecimalTransformer } from '../transformers/decimal.transformer';
 *
 * export class Dividend {
 *   @Column({
 *     type: 'decimal',
 *     precision: 18,
 *     scale: 8,
 *     transformer: new DecimalTransformer()
 *   })
 *   valorBruto: Decimal;
 * }
 * ```
 *
 * **FASE 101:** Wheel Turbinada - Financial Compliance
 * @see {@link https://mikemcl.github.io/decimal.js/}
 */
export class DecimalTransformer implements ValueTransformer {
  /**
   * Transforma Decimal.js → PostgreSQL decimal string
   *
   * Chamado ao SALVAR entity no banco de dados.
   * Converte instância Decimal.js para string para armazenamento em PostgreSQL.
   *
   * @param value - Decimal.js instance ou null/undefined
   * @returns String representation ou null
   * @throws TypeError se value não é Decimal (type safety)
   *
   * @example
   * const decimal = new Decimal('123.456789');
   * transformer.to(decimal); // '123.456789'
   */
  to(value?: Decimal | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (!(value instanceof Decimal)) {
      throw new TypeError(
        `DecimalTransformer.to() expected Decimal instance, got ${typeof value}. ` +
          `Ensure entity property is typed as 'Decimal' not 'number'.`,
      );
    }

    return value.toString();
  }

  /**
   * Transforma PostgreSQL decimal string → Decimal.js
   *
   * Chamado ao LER entity do banco de dados.
   * Converte string do PostgreSQL para instância Decimal.js.
   *
   * @param value - PostgreSQL decimal value (string ou number) ou null
   * @returns Decimal.js instance ou null
   *
   * @example
   * transformer.from('123.456789'); // Decimal('123.456789')
   * transformer.from(123.456789);   // Decimal('123.456789')
   * transformer.from(null);         // null
   */
  from(value?: string | number | null): Decimal | null {
    if (value === null || value === undefined) {
      return null;
    }

    return new Decimal(value);
  }
}
