import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEntity } from './contract.entity';
import { ContractEventEntity } from './contract-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity, ContractEventEntity])],
  exports: [TypeOrmModule],
})
export class EntitiesModule {}

