import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analysis, Asset } from '@database/entities';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ScrapersModule } from '@scrapers/scrapers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis, Asset]), ScrapersModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
