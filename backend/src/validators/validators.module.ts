import { Module } from '@nestjs/common';
import { ValidatorsService } from './validators.service';

@Module({
  providers: [ValidatorsService],
  exports: [ValidatorsService],
})
export class ValidatorsModule {}
