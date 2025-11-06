import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { DocumentShardingService } from './services/document-sharding.service';
import { MultiAgentAnalysisService } from './services/multi-agent-analysis.service';

// Agents
import {
  FundamentalAnalystAgent,
  TechnicalAnalystAgent,
  SentimentAnalystAgent,
  RiskAnalystAgent,
  MacroAnalystAgent,
} from './agents';

/**
 * Módulo de IA
 * Responsável por análises com agentes especializados e document sharding
 */
@Module({
  imports: [ConfigModule],
  providers: [
    // Services
    DocumentShardingService,
    MultiAgentAnalysisService,

    // Agents
    FundamentalAnalystAgent,
    TechnicalAnalystAgent,
    SentimentAnalystAgent,
    RiskAnalystAgent,
    MacroAnalystAgent,
  ],
  exports: [
    DocumentShardingService,
    MultiAgentAnalysisService,
    FundamentalAnalystAgent,
    TechnicalAnalystAgent,
    SentimentAnalystAgent,
    RiskAnalystAgent,
    MacroAnalystAgent,
  ],
})
export class AiModule {}
