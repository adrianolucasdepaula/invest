import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TechnicalIndicatorsService } from './technical-indicators.service';
import { TechnicalAnalysisService } from './technical-analysis.service';
import { PythonClientService } from './python-client.service';

@Module({
  imports: [ConfigModule],
  providers: [TechnicalIndicatorsService, TechnicalAnalysisService, PythonClientService],
  exports: [TechnicalIndicatorsService, TechnicalAnalysisService, PythonClientService],
})
export class TechnicalAnalysisModule {}
