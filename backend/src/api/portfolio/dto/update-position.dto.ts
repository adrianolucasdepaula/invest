import { PartialType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { AddPositionDto } from './add-position.dto';

export class UpdatePositionDto extends PartialType(
  OmitType(AddPositionDto, ['ticker'] as const)
) {}
