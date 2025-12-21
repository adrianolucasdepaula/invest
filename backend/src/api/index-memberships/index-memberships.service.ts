import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { Asset, AssetIndexMembership } from '@database/entities';

@Injectable()
export class IndexMembershipsService {
  private readonly logger = new Logger(IndexMembershipsService.name);

  constructor(
    @InjectRepository(AssetIndexMembership)
    private membershipRepo: Repository<AssetIndexMembership>,
    @InjectRepository(Asset)
    private assetRepo: Repository<Asset>,
  ) {}

  /**
   * Sync index composition from Python scraper
   *
   * @param indexName - Index name (e.g., 'IDIV', 'IBOV')
   * @returns Object with success status and count of synced assets
   */
  async syncComposition(indexName: string): Promise<{ success: boolean; count: number; message: string }> {
    try {
      this.logger.log(`Starting sync for ${indexName} composition`);

      // Step 1: Call Python scraper via HTTP
      const scraperUrl = process.env.PYTHON_API_URL || 'http://scrapers:8000';
      const endpoint = `${scraperUrl}/api/scrapers/test`;

      this.logger.log(`Calling scraper at ${endpoint} for ${indexName}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scraper: indexName.toUpperCase(),
          query: 'all', // IDIV doesn't need a specific ticker
        }),
      });

      if (!response.ok) {
        throw new Error(`Scraper API returned ${response.status}: ${response.statusText}`);
      }

      const scraperResult = await response.json();

      if (!scraperResult.success) {
        this.logger.error(`Scraper failed: ${scraperResult.error || 'Unknown error'}`);
        return {
          success: false,
          count: 0,
          message: `Scraper failed: ${scraperResult.error || 'Unknown error'}`,
        };
      }

      // Extract composition data from scraper response
      const { composition, valid_from, valid_to, index_name } = scraperResult.data;

      if (!composition || !Array.isArray(composition) || composition.length === 0) {
        this.logger.warn(`No composition data returned from scraper`);
        return {
          success: false,
          count: 0,
          message: 'No composition data returned from scraper',
        };
      }

      this.logger.log(`Received ${composition.length} assets from scraper`);

      // Step 2: Delete existing memberships of the same period (same valid_from)
      const validFromDate = new Date(valid_from);
      await this.deleteExistingPeriodMemberships(index_name || indexName.toUpperCase(), validFromDate);

      // Step 3: Invalidate previous memberships (set valid_to for older periods)
      await this.invalidatePreviousMemberships(index_name || indexName.toUpperCase(), validFromDate);

      // Step 4: Save new memberships
      let count = 0;
      for (const item of composition) {
        // Find asset by ticker
        const asset = await this.assetRepo.findOne({
          where: { ticker: item.ticker },
        });

        if (!asset) {
          this.logger.warn(`Asset ${item.ticker} not found in database, skipping`);
          continue;
        }

        // Create membership record
        await this.membershipRepo.save({
          assetId: asset.id,
          indexName: index_name || indexName.toUpperCase(),
          participationPercent: item.participation || item.participationPercent,
          theoreticalQuantity: item.quantity || item.theoreticalQuantity || null,
          validFrom: new Date(valid_from),
          validTo: valid_to ? new Date(valid_to) : null,
          metadata: {
            source: item.source || 'B3',
            scrapedAt: new Date().toISOString(),
            confidence: item.confidence || 100,
          },
        });

        count++;
      }

      this.logger.log(`Successfully synced ${count}/${composition.length} assets for ${indexName}`);

      return {
        success: true,
        count,
        message: `Successfully synced ${count} assets`,
      };

    } catch (error) {
      this.logger.error(`Error syncing ${indexName} composition: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current memberships for an index (vigente hoje)
   *
   * @param indexName - Index name (e.g., 'IDIV')
   * @returns Array of current memberships with asset relations
   */
  async getCurrentMemberships(indexName: string): Promise<AssetIndexMembership[]> {
    const today = new Date();

    this.logger.log(`Fetching current memberships for ${indexName} on ${today.toISOString().split('T')[0]}`);

    const memberships = await this.membershipRepo.find({
      where: [
        {
          indexName: indexName.toUpperCase(),
          validFrom: LessThanOrEqual(today),
          validTo: IsNull(),
        },
        {
          indexName: indexName.toUpperCase(),
          validFrom: LessThanOrEqual(today),
          validTo: MoreThanOrEqual(today),
        },
      ],
      relations: ['asset'],
      order: { participationPercent: 'DESC' },
    });

    this.logger.log(`Found ${memberships.length} current memberships for ${indexName}`);

    return memberships;
  }

  /**
   * Get historical memberships for an index
   *
   * @param indexName - Index name (e.g., 'IDIV')
   * @returns Array of all memberships (historical + current)
   */
  async getHistoricalMemberships(indexName: string): Promise<AssetIndexMembership[]> {
    this.logger.log(`Fetching historical memberships for ${indexName}`);

    const memberships = await this.membershipRepo.find({
      where: { indexName: indexName.toUpperCase() },
      relations: ['asset'],
      order: { validFrom: 'DESC', participationPercent: 'DESC' },
    });

    this.logger.log(`Found ${memberships.length} total memberships for ${indexName}`);

    return memberships;
  }

  /**
   * Get all index memberships for a specific asset
   *
   * @param ticker - Asset ticker (e.g., 'PETR4')
   * @returns Array of index memberships for the asset
   */
  async getAssetMemberships(ticker: string): Promise<AssetIndexMembership[]> {
    this.logger.log(`Fetching index memberships for ticker ${ticker}`);

    // Find asset by ticker
    const asset = await this.assetRepo.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ticker ${ticker} not found`);
    }

    // Get all memberships for this asset
    const memberships = await this.membershipRepo.find({
      where: { assetId: asset.id },
      order: { validFrom: 'DESC', indexName: 'ASC' },
    });

    this.logger.log(`Found ${memberships.length} index memberships for ${ticker}`);

    return memberships;
  }

  /**
   * Delete existing memberships of the same period (same valid_from)
   * Called before inserting new membership data to avoid unique constraint violations
   *
   * @param indexName - Index name
   * @param validFrom - Start date of the period
   * @private
   */
  private async deleteExistingPeriodMemberships(indexName: string, validFrom: Date): Promise<void> {
    this.logger.log(`Deleting existing ${indexName} memberships for period starting ${validFrom.toISOString()}`);

    const result = await this.membershipRepo
      .createQueryBuilder()
      .delete()
      .from(AssetIndexMembership)
      .where('index_name = :indexName', { indexName: indexName.toUpperCase() })
      .andWhere('valid_from = :validFrom', { validFrom })
      .execute();

    this.logger.log(`Deleted ${result.affected} existing memberships for ${indexName} period ${validFrom.toISOString()}`);
  }

  /**
   * Invalidate previous memberships (close old periods)
   * Called before inserting new membership period
   *
   * @param indexName - Index name
   * @param newValidFrom - Start date of new period
   * @private
   */
  private async invalidatePreviousMemberships(indexName: string, newValidFrom: Date): Promise<void> {
    this.logger.log(`Invalidating previous ${indexName} memberships before ${newValidFrom.toISOString()}`);

    // Calculate valid_to as day before new period starts
    const validTo = new Date(newValidFrom);
    validTo.setDate(validTo.getDate() - 1);

    // Update all open memberships (valid_to = null) for this index
    const result = await this.membershipRepo
      .createQueryBuilder()
      .update(AssetIndexMembership)
      .set({ validTo })
      .where('index_name = :indexName', { indexName: indexName.toUpperCase() })
      .andWhere('valid_to IS NULL')
      .andWhere('valid_from < :newValidFrom', { newValidFrom })
      .execute();

    this.logger.log(`Closed ${result.affected} previous memberships for ${indexName}`);
  }
}
