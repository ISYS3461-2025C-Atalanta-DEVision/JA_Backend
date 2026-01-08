import { Module, Logger } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerModule } from "@libs/mailer";
import { RedisModule } from "@redis/redis.module";
import { HealthController } from "./health.controller";
import { modules as appModules } from "./apps";
import { KafkaModule } from "./kafka";
import {
  MongodbModule,
  ConfigurationModule,
  APP_CONFIG_SERVICE_PROVIDER,
  IAppConfigService,
} from "./libs";

@Module({
  imports: [
    ConfigurationModule,
    MongooseModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: (appConfigService: IAppConfigService) => {
        const dbUrl = appConfigService.getDbUrl();
        Logger.log(
          `[MongooseModule] DB_URL: ${dbUrl ? "found" : "NOT FOUND"}`,
          "Bootstrap",
        );
        return {
          uri: dbUrl,
        };
      },
      inject: [APP_CONFIG_SERVICE_PROVIDER],
    }),
    // Redis for real-time notification PubSub
    RedisModule.forRootAsync({
      useFactory: (appConfigService: IAppConfigService) => {
        const redisConfig = appConfigService.getRedisConfig();
        if (redisConfig.url) {
          return { type: "single", url: redisConfig.url };
        }
        return {
          type: "single",
          options: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            lazyConnect: true,
          },
        };
      },
      inject: [APP_CONFIG_SERVICE_PROVIDER],
    }),
    MailerModule,
    MongodbModule,
    KafkaModule, // Kafka event handlers
    ...appModules, // TCP handlers (NotificationModule)
  ],
  controllers: [HealthController],
})
export class AppModule {}
