import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ScraperExecutionProfile } from '../entities';

const logger = new Logger('ExecutionProfilesSeed');

/**
 * Seed: Popular tabela scraper_execution_profiles
 *
 * Cria 4 perfis pré-definidos:
 * 1. Mínimo (2 scrapers) - ~35s
 * 2. Rápido (3 scrapers) - ~60s - DEFAULT
 * 3. Alta Precisão (5 scrapers) - ~120s
 * 4. Fundamentais Only (4 scrapers) - ~90s
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md - Seção 4
 */
export async function seedExecutionProfiles(dataSource: DataSource): Promise<void> {
  const profileRepo = dataSource.getRepository(ScraperExecutionProfile);

  // Limpar dados existentes
  await profileRepo.clear();

  const profiles: Partial<ScraperExecutionProfile>[] = [
    // ========================================================================
    // PERFIL 1: MÍNIMO
    // ========================================================================
    {
      name: 'minimal',
      displayName: 'Mínimo',
      description: 'Cross-validation básica com 2 scrapers rápidos. Máxima velocidade.',
      isDefault: false,
      isSystem: true, // Não pode ser deletado
      config: {
        minScrapers: 2,
        maxScrapers: 2,
        scraperIds: ['fundamentus', 'brapi'],
        priorityOrder: ['brapi', 'fundamentus'], // brapi primeiro (mais rápido)
        fallbackEnabled: false,
        estimatedDuration: 35, // segundos
        estimatedCost: 15, // score 0-100
      },
    },

    // ========================================================================
    // PERFIL 2: RÁPIDO (DEFAULT)
    // ========================================================================
    {
      name: 'fast',
      displayName: 'Rápido',
      description: 'Balanço entre velocidade e confiança. 3 scrapers confiáveis.',
      isDefault: true, // Perfil padrão
      isSystem: true,
      config: {
        minScrapers: 3,
        maxScrapers: 3,
        scraperIds: ['fundamentus', 'brapi', 'statusinvest'],
        priorityOrder: ['brapi', 'fundamentus', 'statusinvest'],
        fallbackEnabled: false,
        estimatedDuration: 60,
        estimatedCost: 30,
      },
    },

    // ========================================================================
    // PERFIL 3: ALTA PRECISÃO
    // ========================================================================
    {
      name: 'high_accuracy',
      displayName: 'Alta Precisão',
      description: 'Máxima confiança com todos os scrapers TypeScript. Fallback Python ativo.',
      isDefault: false,
      isSystem: true,
      config: {
        minScrapers: 5,
        maxScrapers: 5,
        scraperIds: ['fundamentus', 'brapi', 'statusinvest', 'investidor10', 'investsite'],
        priorityOrder: ['brapi', 'fundamentus', 'statusinvest', 'investidor10', 'investsite'],
        fallbackEnabled: true, // Ativa Python se necessário
        estimatedDuration: 120,
        estimatedCost: 60,
      },
    },

    // ========================================================================
    // PERFIL 4: FUNDAMENTAIS ONLY
    // ========================================================================
    {
      name: 'fundamentals_only',
      displayName: 'Apenas Fundamentais',
      description: 'Dados puramente fundamentalistas. 4 scrapers especializados.',
      isDefault: false,
      isSystem: true,
      config: {
        minScrapers: 4,
        maxScrapers: 4,
        scraperIds: ['fundamentus', 'brapi', 'statusinvest', 'investidor10'],
        priorityOrder: ['brapi', 'fundamentus', 'statusinvest', 'investidor10'],
        fallbackEnabled: false,
        estimatedDuration: 90,
        estimatedCost: 45,
      },
    },
  ];

  // Inserir em batch
  await profileRepo.save(profiles);

  // BUG-010 FIX: Usar logger estruturado ao invés de console.log (CLAUDE.md)
  logger.log(`✅ Seed: ${profiles.length} perfis inseridos em scraper_execution_profiles`);
}
