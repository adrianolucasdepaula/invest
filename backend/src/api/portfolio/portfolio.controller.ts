import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
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

  @Get(':id')
  @ApiOperation({ summary: 'Get specific portfolio' })
  async getPortfolio(@Req() req: any, @Param('id') id: string) {
    return this.portfolioService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create portfolio' })
  async createPortfolio(@Req() req: any, @Body() data: any) {
    return this.portfolioService.create(req.user.id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update portfolio' })
  async updatePortfolio(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.portfolioService.update(id, req.user.id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete portfolio' })
  async deletePortfolio(@Req() req: any, @Param('id') id: string) {
    await this.portfolioService.remove(id, req.user.id);
    return { success: true };
  }

  @Post(':portfolioId/positions')
  @ApiOperation({ summary: 'Add position to portfolio' })
  async addPosition(
    @Req() req: any,
    @Param('portfolioId') portfolioId: string,
    @Body() data: any,
  ) {
    return this.portfolioService.addPosition(portfolioId, req.user.id, data);
  }

  @Patch(':portfolioId/positions/:positionId')
  @ApiOperation({ summary: 'Update position' })
  async updatePosition(
    @Req() req: any,
    @Param('portfolioId') portfolioId: string,
    @Param('positionId') positionId: string,
    @Body() data: any,
  ) {
    return this.portfolioService.updatePosition(portfolioId, positionId, req.user.id, data);
  }

  @Delete(':portfolioId/positions/:positionId')
  @ApiOperation({ summary: 'Delete position' })
  async deletePosition(
    @Req() req: any,
    @Param('portfolioId') portfolioId: string,
    @Param('positionId') positionId: string,
  ) {
    await this.portfolioService.removePosition(portfolioId, positionId, req.user.id);
    return { success: true };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import portfolio from file' })
  async importPortfolio(@Req() req: any, @Body() data: any) {
    // TODO: Implement file upload handling with multer
    // For now, pass empty buffer and filename
    const buffer = Buffer.from(JSON.stringify(data));
    const filename = 'import.json';
    return this.portfolioService.importFromFile(req.user.id, buffer, filename);
  }
}
