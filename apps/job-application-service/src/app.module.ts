import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { modules as dalModules, ConfigurationModule, APP_CONFIG_SERVICE_PROVIDER, IAppConfigService } from './libs';
import { modules } from './apps';
import { HealthController } from './health.controller';
import { KafkaModule } from '@kafka/kafka.module';

@Module({
  imports: [
    ...dalModules,
    MongooseModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: (appConfigService: IAppConfigService) => {
        const dbUrl = appConfigService.getDbUrl();
        Logger.log(`[MongooseModule] DB_URL: ${dbUrl ? 'found' : 'NOT FOUND'}`, 'Bootstrap');
        return {
          uri: dbUrl,
        };
      },
      inject: [APP_CONFIG_SERVICE_PROVIDER],
    }),
    KafkaModule,
    ...modules
  ],
  controllers: [HealthController],
})
export class AppModule { }
