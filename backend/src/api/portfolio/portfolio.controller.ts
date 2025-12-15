import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  CreatePositionDto,
  UpdatePositionDto,
  ImportPortfolioDto,
  PortfolioResponseDto,
  PositionResponseDto,
} from './dto';

@ApiTags('portfolio')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PortfolioController {
  private readonly logger = new Logger(PortfolioController.name);

  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get user portfolios' })
  @ApiResponse({ status: 200, description: 'List of user portfolios', type: [PortfolioResponseDto] })
  async getPortfolios(@Req() req: Request & { user: { id: string } }): Promise<PortfolioResponseDto[]> {
    return this.portfolioService.findUserPortfolios(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio details', type: PortfolioResponseDto })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPortfolio(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create portfolio' })
  @ApiResponse({ status: 201, description: 'Portfolio created', type: PortfolioResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createPortfolio(
    @Req() req: Request & { user: { id: string } },
    @Body() data: CreatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.create(req.user.id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio updated', type: PortfolioResponseDto })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async updatePortfolio(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() data: UpdatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.update(id, req.user.id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio deleted' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async deletePortfolio(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.portfolioService.remove(id, req.user.id);
    return { success: true };
  }

  @Post(':portfolioId/positions')
  @ApiOperation({ summary: 'Add position to portfolio' })
  @ApiResponse({ status: 201, description: 'Position added', type: PositionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Portfolio or asset not found' })
  async addPosition(
    @Req() req: Request & { user: { id: string } },
    @Param('portfolioId') portfolioId: string,
    @Body() data: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.portfolioService.addPosition(portfolioId, req.user.id, data);
  }

  @Patch(':portfolioId/positions/:positionId')
  @ApiOperation({ summary: 'Update position' })
  @ApiResponse({ status: 200, description: 'Position updated', type: PositionResponseDto })
  @ApiResponse({ status: 404, description: 'Position not found' })
  async updatePosition(
    @Req() req: Request & { user: { id: string } },
    @Param('portfolioId') portfolioId: string,
    @Param('positionId') positionId: string,
    @Body() data: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    return this.portfolioService.updatePosition(portfolioId, positionId, req.user.id, data);
  }

  @Delete(':portfolioId/positions/:positionId')
  @ApiOperation({ summary: 'Delete position' })
  @ApiResponse({ status: 200, description: 'Position deleted' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  async deletePosition(
    @Req() req: Request & { user: { id: string } },
    @Param('portfolioId') portfolioId: string,
    @Param('positionId') positionId: string,
  ): Promise<{ success: boolean }> {
    await this.portfolioService.removePosition(portfolioId, positionId, req.user.id);
    return { success: true };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import portfolio from file or data' })
  @ApiResponse({ status: 201, description: 'Portfolio imported', type: PortfolioResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid import data' })
  async importPortfolio(
    @Req() req: Request & { user: { id: string } },
    @Body() data: ImportPortfolioDto,
  ): Promise<PortfolioResponseDto> {
    // Handle direct positions import or file data
    if (data.positions && data.positions.length > 0) {
      return this.portfolioService.importPositions(req.user.id, data);
    }
    // File data import
    const buffer = data.fileData ? Buffer.from(data.fileData, 'base64') : Buffer.from('{}');
    const filename = data.filename || 'import.json';
    return this.portfolioService.importFromFile(req.user.id, buffer, filename);
  }
}
