import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsController } from './contracts/contracts.controller';
import { ContractsService } from './contracts/contracts.service';
import { EntitiesModule } from './entities/entities.module';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { PaymentsModule } from './payments/payments.module';
import { HostedController } from './hosted/hosted.controller';
import { ContractEntity } from './entities/contract.entity';
import { ContractEventEntity } from './entities/contract-event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // MVP only. Use migrations for production.
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([ContractEntity, ContractEventEntity]),
    EntitiesModule,
    PaymentsModule,
  ],
  controllers: [ContractsController, WebhooksController, HostedController],
  providers: [ContractsService, WebhooksService],
})
export class AppModule {}

