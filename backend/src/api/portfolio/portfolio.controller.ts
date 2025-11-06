import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('portfolio')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get user portfolios' })
  async getPortfolios(@Req() req: any) {
    return this.portfolioService.findUserPortfolios(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create portfolio' })
  async createPortfolio(@Req() req: any, @Body() data: any) {
    return this.portfolioService.create(req.user.id, data);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import portfolio from file' })
  async importPortfolio(@Req() req: any, @Body() data: any) {
    return this.portfolioService.importFromFile(req.user.id, data);
  }
}
