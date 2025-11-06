import { Module } from '@nestjs/common';
import { TechnicalIndicatorsService } from './technical-indicators.service';
import { TechnicalAnalysisService } from './technical-analysis.service';

@Module({
  providers: [TechnicalIndicatorsService, TechnicalAnalysisService],
  exports: [TechnicalIndicatorsService, TechnicalAnalysisService],
})
export class TechnicalAnalysisModule {}
