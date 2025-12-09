import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule as SharedAuthModule } from '@auth/auth.module';
import { JwtAuthGuard } from '@auth/guards';
import { ApplicantModule, AuthModule } from './apis';

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
        // Firebase Admin SDK configuration (replaces Google/Facebook OAuth)
        firebaseProjectId: configService.get<string>('FIREBASE_PROJECT_ID'),
        firebaseClientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        firebasePrivateKey: configService.get<string>('FIREBASE_PRIVATE_KEY'),
      }),
      inject: [ConfigService],
    }),
    // API modules (new structure)
    ApplicantModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
