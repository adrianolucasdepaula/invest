import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset, AssetIndexMembership } from '@database/entities';
import { IndexMembershipsController } from './index-memberships.controller';
import { IndexMembershipsService } from './index-memberships.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, AssetIndexMembership]),
  ],
  controllers: [IndexMembershipsController],
  providers: [IndexMembershipsService],
  exports: [IndexMembershipsService],
})
export class IndexMembershipsModule {}
