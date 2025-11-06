import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':ticker/generate')
  @ApiOperation({ summary: 'Generate complete report for asset' })
  async generateReport(@Param('ticker') ticker: string) {
    return this.reportsService.generateCompleteReport(ticker);
  }
}
