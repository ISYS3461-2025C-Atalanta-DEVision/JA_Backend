import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@libs/mailer';
import { RedisModule } from '@redis/redis.module';
import { HealthController } from './health.controller';
import { NotificationModule } from './notification/notification.module';
import { MongodbModule } from './libs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('NOTIFICATION_MONGO_URI') ||
          configService.get<string>('DB_URL');
        Logger.log(
          `[MongooseModule] DB_URL: ${dbUrl ? 'found' : 'NOT FOUND'}`,
          'Bootstrap',
        );
        return {
          uri: dbUrl,
        };
      },
      inject: [ConfigService],
    }),
    // Redis for real-time notification PubSub
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return { type: 'single', url: redisUrl };
        }
        return {
          type: 'single',
          options: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
            password: configService.get<string>('REDIS_PASSWORD'),
            lazyConnect: true,
          },
        };
      },
      inject: [ConfigService],
    }),
    MailerModule,
    MongodbModule,
    NotificationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
