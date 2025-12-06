import { Module } from '@nestjs/common';
import { ValidatorsService } from './validators.service';
import { CrossValidationService } from './cross-validation.service';

@Module({
  providers: [ValidatorsService, CrossValidationService],
  exports: [ValidatorsService, CrossValidationService],
})
export class ValidatorsModule {}
