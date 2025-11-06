import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'scraping' },
      { name: 'analysis' },
      { name: 'reports' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
