import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('scraper_metrics')
@Index('IDX_scraper_metrics_scraper_id', ['scraperId'])
@Index('IDX_scraper_metrics_created_at', ['createdAt'])
@Index('IDX_scraper_metrics_scraper_operation', ['scraperId', 'operationType'])
export class ScraperMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'scraper_id', type: 'varchar', length: 50 })
  scraperId: string;

  @Column({ name: 'operation_type', type: 'varchar', length: 10 })
  operationType: 'test' | 'sync';

  @Column({ name: 'ticker', type: 'varchar', length: 10, nullable: true })
  ticker: string | null;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ name: 'response_time', type: 'integer', nullable: true })
  responseTime: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
