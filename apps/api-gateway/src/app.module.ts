import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule as SharedAuthModule } from '@auth/auth.module';
import { JweAuthGuard } from '@auth/guards';
import { RedisModule } from '@redis/redis.module';
import { ApplicantModule, AuthModule, JobCategoryModule, SkillModule } from './apis';
import { CountriesModule } from './apis/countries';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [{
        ttl: configService.get<number>('THROTTLE_TTL') || 60000,
        limit: configService.get<number>('THROTTLE_LIMIT') || 10,
      }],
      inject: [ConfigService],
    }),
    SharedAuthModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        jwtSecret: configService.get<string>('JWT_SECRET_APPLICANT') || 'applicant-secret',
        jwtRefreshSecret: configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
        jwtExpiresIn: '30m',
        jwtRefreshExpiresIn: '7d',
        // JWE encryption secrets (optional, falls back to JWT secrets)
        jweAccessSecret: configService.get<string>('JWE_ACCESS_SECRET'),
        jweRefreshSecret: configService.get<string>('JWE_REFRESH_SECRET'),
        // Firebase Admin SDK configuration (replaces Google/Facebook OAuth)
        firebaseProjectId: configService.get<string>('FIREBASE_PROJECT_ID'),
        firebaseClientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        firebasePrivateKey: configService.get<string>('FIREBASE_PRIVATE_KEY'),
      }),
      inject: [ConfigService],
    }),
    // Redis module for token revocation (optional - works without Redis)
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
            lazyConnect: true, // Don't fail if Redis is not available
          },
        };
      },
      inject: [ConfigService],
    }),
    // API modules (new structure)
    ApplicantModule,
    AuthModule,
    CountriesModule,
    JobCategoryModule,
    SkillModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JweAuthGuard,
    },
  ],
})
export class AppModule { }
