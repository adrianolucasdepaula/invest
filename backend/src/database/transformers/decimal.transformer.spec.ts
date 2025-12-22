import { DecimalTransformer } from './decimal.transformer';
import Decimal from 'decimal.js';

describe('DecimalTransformer', () => {
  let transformer: DecimalTransformer;

  beforeEach(() => {
    transformer = new DecimalTransformer();
  });

  describe('to() - Decimal.js → PostgreSQL', () => {
    it('should convert Decimal to string', () => {
      const decimal = new Decimal('123.456789');
      const result = transformer.to(decimal);

      expect(result).toBe('123.456789');
      expect(typeof result).toBe('string');
    });

    it('should handle null', () => {
      expect(transformer.to(null)).toBeNull();
    });

    it('should handle undefined', () => {
      expect(transformer.to(undefined)).toBeNull();
    });

    it('should throw TypeError if value is not Decimal', () => {
      expect(() => {
        transformer.to(123 as any);
      }).toThrow(TypeError);

      expect(() => {
        transformer.to('123.456' as any);
      }).toThrow(TypeError);

      expect(() => {
        transformer.to({ value: 123 } as any);
      }).toThrow(TypeError);
    });

    it('should preserve precision in string representation', () => {
      const decimal = new Decimal('0.123456789012345678');
      const result = transformer.to(decimal);

      expect(result).toBe('0.123456789012345678');
      // Decimal mantém 18 casas decimais
      expect(result.length).toBeGreaterThan(10);
    });

    it('should handle very large numbers', () => {
      const decimal = new Decimal('999999999999999999.99999999');
      const result = transformer.to(decimal);

      expect(result).toBe('999999999999999999.99999999');
    });

    it('should handle very small numbers', () => {
      const decimal = new Decimal('0.00000001');
      const result = transformer.to(decimal);

      // Decimal.js pode usar notação científica para números muito pequenos
      expect(result).toBe('1e-8'); // Equivalent to 0.00000001
    });
  });

  describe('from() - PostgreSQL → Decimal.js', () => {
    it('should convert string to Decimal', () => {
      const result = transformer.from('123.456789');

      expect(result).toBeInstanceOf(Decimal);
      expect(result!.toString()).toBe('123.456789');
    });

    it('should convert number to Decimal', () => {
      const result = transformer.from(123.456789);

      expect(result).toBeInstanceOf(Decimal);
      expect(result!.toNumber()).toBeCloseTo(123.456789, 6);
    });

    it('should handle null', () => {
      expect(transformer.from(null)).toBeNull();
    });

    it('should handle undefined', () => {
      expect(transformer.from(undefined)).toBeNull();
    });

    it('should preserve precision from string', () => {
      const result = transformer.from('0.123456789012345678');

      expect(result!.toString()).toBe('0.123456789012345678');
    });

    it('should handle integer strings', () => {
      const result = transformer.from('12345');

      expect(result).toBeInstanceOf(Decimal);
      expect(result!.toString()).toBe('12345');
    });

    it('should handle negative numbers', () => {
      const result = transformer.from('-123.456');

      expect(result).toBeInstanceOf(Decimal);
      expect(result!.toString()).toBe('-123.456');
    });
  });

  describe('Financial Precision Tests (CRITICAL)', () => {
    it('should solve JavaScript float precision issue (0.1 + 0.2)', () => {
      // ❌ JavaScript native (ERRADO):
      // 0.1 + 0.2 === 0.3  // false! (0.30000000000000004)

      // ✅ Com Decimal.js (CORRETO):
      const value1 = transformer.from('0.1');
      const value2 = transformer.from('0.2');
      const sum = value1!.plus(value2!);

      expect(sum.equals('0.3')).toBe(true);
      expect(sum.toString()).toBe('0.3');
    });

    it('should maintain precision in dividend calculations', () => {
      // Exemplo real: Dividendo PETR4
      // Valor por ação: R$ 0.87352000 (8 casas decimais)
      // 100 ações
      const valorPorAcao = transformer.from('0.87352000');
      const quantidade = new Decimal(100);
      const totalDividendos = valorPorAcao!.times(quantidade);

      expect(totalDividendos.toString()).toBe('87.352');
      // Sem Decimal.js: 87.35200000000001 (float imprecision)
    });

    it('should calculate JCP tax (15%) with precision', () => {
      // Exemplo: JCP R$ 1.234567 por ação
      // Imposto: 15%
      const valorBruto = transformer.from('1.234567');
      const tax = valorBruto!.times(0.15);
      const valorLiquido = valorBruto!.minus(tax);

      expect(tax.toFixed(8)).toBe('0.18518505');
      expect(valorLiquido.toFixed(8)).toBe('1.04938195');
      // Total: 1.234567 (conferência)
      expect(tax.plus(valorLiquido).equals(valorBruto!)).toBe(true);
    });

    it('should handle stock lending rate calculations', () => {
      // Taxa anual: 5.5432% a.a.
      // Taxa diária: taxa_ano / 252 (dias úteis)
      const taxaAno = transformer.from('5.5432');
      const taxaDia = taxaAno!.dividedBy(252);

      // Precisão: 5.5432 / 252 = 0.021996825...
      expect(taxaDia.toFixed(8)).toBe('0.02199683'); // Arredondamento correto

      // Receita diária: 1000 ações * R$ 50 * taxa_diaria / 100
      const quantidade = new Decimal(1000);
      const preco = new Decimal(50);
      const receitaDiaria = quantidade.times(preco).times(taxaDia).dividedBy(100);

      // Cálculo: 1000 * 50 * 0.02199683 / 100 = 10.998415
      expect(receitaDiaria.toFixed(2)).toBe('11.00'); // Arredondamento correto
    });

    it('should handle rounding in backtest calculations', () => {
      // Backtest: Capital inicial R$ 100,000.00
      // Retorno: 22.3456%
      const capital = transformer.from('100000');
      const returnPct = new Decimal('22.3456');
      const profit = capital!.times(returnPct).dividedBy(100);
      const finalCapital = capital!.plus(profit);

      expect(profit.toFixed(2)).toBe('22345.60');
      expect(finalCapital.toFixed(2)).toBe('122345.60');
    });
  });

  describe('Round-trip Tests (to → from)', () => {
    it('should preserve value through round-trip', () => {
      const original = new Decimal('123.456789');

      // to() → string
      const stringValue = transformer.to(original);
      // from() → Decimal
      const restored = transformer.from(stringValue);

      expect(restored!.equals(original)).toBe(true);
      expect(restored!.toString()).toBe('123.456789');
    });

    it('should handle round-trip with very precise values', () => {
      const original = new Decimal('0.123456789012345678');

      const stringValue = transformer.to(original);
      const restored = transformer.from(stringValue);

      expect(restored!.equals(original)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero', () => {
      const zero = new Decimal(0);
      const stringValue = transformer.to(zero);
      const restored = transformer.from(stringValue);

      expect(restored!.equals(0)).toBe(true);
      expect(restored!.toString()).toBe('0');
    });

    it('should handle negative zero', () => {
      const negativeZero = new Decimal('-0');
      const stringValue = transformer.to(negativeZero);

      expect(stringValue).toBe('0'); // Decimal normalizes -0 to 0
    });

    it('should handle scientific notation from PostgreSQL', () => {
      // PostgreSQL pode retornar números em notação científica
      const result = transformer.from('1.23e5');

      expect(result).toBeInstanceOf(Decimal);
      expect(result!.toNumber()).toBe(123000);
    });
  });
});
