import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

export interface UploadResult {
  bucket: string;
  objectName: string;
  etag: string;
  size: number;
  contentType: string;
}

export interface ObjectInfo {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private isConnected = false;

  // Default buckets
  readonly BUCKETS = {
    SCRAPED_HTML: 'scraped-html',
    REPORTS: 'reports',
    EXPORTS: 'exports',
    ARCHIVES: 'archives', // FASE 145: Dedicated bucket for archived data (JSONL)
    BACKUPS: 'backups',
  } as const;

  constructor(private readonly configService: ConfigService) {
    const endPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<number>('MINIO_PORT', 9000);
    const accessKey = this.configService.get<string>('MINIO_ROOT_USER', 'minioadmin');
    const secretKey = this.configService.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin123');

    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL: false,
      accessKey,
      secretKey,
      // Note: Timeout is handled via Promise.race in operations instead of transport
    });
  }

  async onModuleInit() {
    try {
      // ✅ FASE 145 FIX: Add timeout wrapper (10s total)
      await Promise.race([
        this.initializeMinIO(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MinIO init timeout after 10s')), 10000)
        ),
      ]);
    } catch (error) {
      this.logger.warn(`MinIO not available: ${error.message}. Storage features disabled.`);
      this.isConnected = false;  // ✅ Graceful degradation
    }
  }

  /**
   * FASE 145 FIX: Initialize MinIO with parallelized operations
   */
  private async initializeMinIO() {
    // Test connection
    await this.client.listBuckets();
    this.isConnected = true;
    this.logger.log('MinIO connected successfully');

    // ✅ PARALLELIZE bucket creation + lifecycle setup
    const lifecycleEnabled = this.configService.get<string>('MINIO_LIFECYCLE_ENABLED') === 'true';

    await Promise.all([
      this.initializeBuckets(),
      lifecycleEnabled ? this.setupLifecyclePolicies() : Promise.resolve(),
    ]);
  }

  private async initializeBuckets() {
    for (const bucket of Object.values(this.BUCKETS)) {
      try {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket);
          this.logger.log(`Created bucket: ${bucket}`);
        }
      } catch (error) {
        this.logger.error(`Failed to create bucket ${bucket}: ${error.message}`);
      }
    }
  }

  /**
   * FASE 145: Setup lifecycle policies for all buckets
   */
  private async setupLifecyclePolicies() {
    try {
      // Get retention days from config
      const scrapedHtmlDays = parseInt(
        this.configService.get<string>('MINIO_LIFECYCLE_SCRAPED_HTML_DAYS', '30'),
        10,
      );
      const reportsDays = parseInt(
        this.configService.get<string>('MINIO_LIFECYCLE_REPORTS_DAYS', '90'),
        10,
      );
      const exportsDays = parseInt(
        this.configService.get<string>('MINIO_LIFECYCLE_EXPORTS_DAYS', '14'),
        10,
      );

      // Setup lifecycle for each bucket
      await this.setupBucketLifecycle(this.BUCKETS.SCRAPED_HTML, scrapedHtmlDays);
      await this.setupBucketLifecycle(this.BUCKETS.REPORTS, reportsDays);
      await this.setupBucketLifecycle(this.BUCKETS.EXPORTS, exportsDays);

      this.logger.log('✅ MinIO lifecycle policies configured successfully');
    } catch (error) {
      this.logger.error(`Failed to setup lifecycle policies: ${error.message}`);
    }
  }

  /**
   * FASE 145: Setup lifecycle policy for a specific bucket
   * Automatically deletes objects older than specified days
   *
   * @param bucket - Bucket name
   * @param days - Number of days to retain objects
   */
  async setupBucketLifecycle(bucket: string, days: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('MinIO not connected');
    }

    try {
      const lifecycleConfig = {
        Rule: [
          {
            ID: `cleanup-${bucket}`,
            Status: 'Enabled',
            Expiration: {
              Days: days,
            },
          },
        ],
      };

      // MinIO uses setBucketLifecycle method
      await this.client.setBucketLifecycle(bucket, lifecycleConfig);

      this.logger.log(`Lifecycle policy set for ${bucket}: delete after ${days} days`);
    } catch (error) {
      this.logger.error(`Failed to set lifecycle for ${bucket}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    bucket: string,
    objectName: string,
    data: Buffer | Readable | string,
    contentType: string = 'application/octet-stream',
    metadata: Record<string, string> = {},
  ): Promise<UploadResult> {
    if (!this.isConnected) {
      throw new Error('MinIO not connected');
    }

    let buffer: Buffer;
    if (typeof data === 'string') {
      buffer = Buffer.from(data, 'utf-8');
    } else if (data instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of data) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } else {
      buffer = data;
    }

    const result = await this.client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
      ...metadata,
    });

    this.logger.log(`Uploaded: ${bucket}/${objectName} (${buffer.length} bytes)`);

    return {
      bucket,
      objectName,
      etag: result.etag,
      size: buffer.length,
      contentType,
    };
  }

  /**
   * Upload scraped HTML content
   */
  async uploadScrapedHtml(
    source: string,
    ticker: string,
    html: string,
    metadata: Record<string, string> = {},
  ): Promise<UploadResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const objectName = `${source}/${ticker}/${timestamp}.html`;

    return this.uploadFile(
      this.BUCKETS.SCRAPED_HTML,
      objectName,
      html,
      'text/html',
      {
        source,
        ticker,
        scrapedAt: new Date().toISOString(),
        ...metadata,
      },
    );
  }

  /**
   * Get a file from MinIO
   */
  async getFile(bucket: string, objectName: string): Promise<Buffer> {
    if (!this.isConnected) {
      throw new Error('MinIO not connected');
    }

    const stream = await this.client.getObject(bucket, objectName);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Get file as string
   */
  async getFileAsString(bucket: string, objectName: string): Promise<string> {
    const buffer = await this.getFile(bucket, objectName);
    return buffer.toString('utf-8');
  }

  /**
   * List objects in a bucket
   */
  async listObjects(
    bucket: string,
    prefix?: string,
    recursive: boolean = true,
  ): Promise<ObjectInfo[]> {
    if (!this.isConnected) {
      return [];
    }

    const objects: ObjectInfo[] = [];
    const stream = this.client.listObjects(bucket, prefix, recursive);

    for await (const obj of stream) {
      objects.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag,
      });
    }

    return objects;
  }

  /**
   * Delete an object
   */
  async deleteObject(bucket: string, objectName: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('MinIO not connected');
    }

    await this.client.removeObject(bucket, objectName);
    this.logger.log(`Deleted: ${bucket}/${objectName}`);
  }

  /**
   * Get presigned URL for download
   */
  async getPresignedUrl(
    bucket: string,
    objectName: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('MinIO not connected');
    }

    return this.client.presignedGetObject(bucket, objectName, expirySeconds);
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    buckets: Array<{
      name: string;
      objectCount: number;
      totalSize: number;
    }>;
  }> {
    if (!this.isConnected) {
      return { connected: false, buckets: [] };
    }

    const buckets = await this.client.listBuckets();
    const bucketStats = await Promise.all(
      buckets.map(async (bucket) => {
        const objects = await this.listObjects(bucket.name);
        return {
          name: bucket.name,
          objectCount: objects.length,
          totalSize: objects.reduce((sum, obj) => sum + obj.size, 0),
        };
      }),
    );

    return {
      connected: true,
      buckets: bucketStats,
    };
  }

  /**
   * Check if MinIO is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.listBuckets();
      return true;
    } catch {
      return false;
    }
  }
}
