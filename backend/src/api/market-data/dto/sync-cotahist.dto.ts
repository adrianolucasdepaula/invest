import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';

/**
 * Top 100 most liquid B3 tickers (FASE 34.5)
 * Updated: 2025-11-19
 * Source: B3 Ibovespa + Most traded stocks
 */
export const B3_TICKERS = [
  // Financeiro
  'BBAS3', 'BBDC3', 'BBDC4', 'ITUB3', 'ITUB4', 'SANB11', 'BBSE3',
  // Commodities
  'VALE3', 'PETR3', 'PETR4', 'SUZB3', 'CSAN3', 'USIM5', 'GGBR4', 'GOAU4', 'CSNA3',
  // Energia
  'ELET3', 'ELET6', 'ENBR3', 'TAEE11', 'ENGI11', 'ENEV3', 'CMIG4', 'CPFE3',
  // Consumo
  'ABEV3', 'JBSS3', 'BRFS3', 'BEEF3', 'SMTO3', 'RAIZ4', 'MRFG3', 'PCAR3',
  // Varejo
  'MGLU3', 'LREN3', 'PETZ3', 'ARZZ3', 'VIIA3', 'ASAI3', 'CRFB3',
  // Construção/Imobiliário
  'EZTC3', 'MRVE3', 'CYRE3', 'MULT3', 'TEND3', 'ALSO3',
  // Transporte/Logística
  'RENT3', 'RAIL3', 'AZUL4', 'GOLL4', 'EMBR3', 'CCRO3',
  // Saúde
  'RADL3', 'HAPV3', 'FLRY3', 'GNDI3', 'QUAL3', 'PNVL3',
  // Tecnologia
  'TOTS3', 'LWSA3', 'POSI3', 'CASH3', 'IFCM3',
  // Siderurgia/Papel
  'KLBN11', 'SUZB3', 'GGBR4', 'CSNA3', 'GOAU4',
  // Telecomunicações
  'VIVT3', 'TIMS3',
  // Utilities
  'SBSP3', 'SAPR4', 'SAPR11', 'CPLE6',
  // Seguros
  'BBSE3', 'CXSE3', 'PSSA3',
  // Diversos
  'B3SA3', 'WEGE3', 'IGTI11', 'YDUQ3', 'COGN3', 'ANIM3', 'CVCB3',
  'BRAP4', 'NTCO3', 'RDOR3', 'SLCE3', 'UGPA3', 'PRIO3', 'RECV3',
  'SOMA3', 'VBBR3', 'CMIN3', 'IRBR3', 'JHSF3', 'DXCO3', 'BRKM5',
  'CIEL3', 'ECOR3', 'RRRP3', 'SULA11', 'KLBN11', 'HYPE3',
];

export class SyncCotahistDto {
  @ApiProperty({
    description: 'Ticker do ativo (ex: ABEV3, PETR4, VALE3). Deve ser um ticker válido da B3.',
    example: 'ABEV3',
  })
  @IsString()
  @IsIn(B3_TICKERS, {
    message: `Ticker inválido. Deve ser um dos ${B3_TICKERS.length} tickers disponíveis na B3.`,
  })
  ticker: string;

  @ApiProperty({
    description: 'Ano inicial para sincronização (1986-2025)',
    example: 2020,
    minimum: 1986,
    maximum: 2025,
    required: false,
  })
  @IsInt()
  @Min(1986)
  @Max(2025)
  @IsOptional()
  startYear?: number = 2020; // Default: últimos 5 anos

  @ApiProperty({
    description: 'Ano final para sincronização (1986-2025)',
    example: 2025,
    minimum: 1986,
    maximum: 2025,
    required: false,
  })
  @IsInt()
  @Min(1986)
  @Max(2025)
  @IsOptional()
  endYear?: number = new Date().getFullYear();
}

export class SyncCotahistResponseDto {
  @ApiProperty({
    description: 'Total de registros sincronizados no PostgreSQL',
    example: 1200,
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Número de anos processados',
    example: 5,
  })
  yearsProcessed: number;

  @ApiProperty({
    description: 'Tempo de processamento em segundos',
    example: 12.5,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Estatísticas de fontes de dados utilizadas',
    example: {
      cotahist: 1150,
      brapi: 67,
      merged: 1200,
    },
  })
  sources: {
    cotahist: number;
    brapi: number;
    merged: number;
  };

  @ApiProperty({
    description: 'Período dos dados sincronizados',
    example: {
      start: '2020-01-02',
      end: '2024-11-15',
    },
  })
  period: {
    start: string;
    end: string;
  };
}
