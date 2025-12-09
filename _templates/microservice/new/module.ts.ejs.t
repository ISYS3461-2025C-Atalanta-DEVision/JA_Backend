---
to: apps/<%= kebabName %>/src/<%= kebabName %>.module.ts
---
<% const { copyrightHeader } = require('../../helpers'); %>
<%= copyrightHeader() %>

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
<% if (database === 'mongodb' || database === 'postgres') { %>import { TypeOrmModule } from '@nestjs/typeorm';<% } %>
<% if (withAuth) { %>import { AuthModule } from '@libs/auth';<% } %>

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
<% if (database === 'mongodb') { %>
    // MongoDB Connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url: configService.get<string>('MONGODB_URI'),
        database: configService.get<string>('MONGODB_DATABASE'),
        useUnifiedTopology: true,
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE') || false,
        logging: configService.get<boolean>('DB_LOGGING') || false,
      }),
      inject: [ConfigService],
    }),
<% } else if (database === 'postgres') { %>
    // PostgreSQL Connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE') || false,
        logging: configService.get<boolean>('DB_LOGGING') || false,
      }),
      inject: [ConfigService],
    }),
<% } %>
<% if (withAuth) { %>
    // Authentication (global module)
    AuthModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        jwtSecret: configService.get<string>('JWT_SECRET') || '<%= kebabName %>-secret-key-change-in-production',
        jwtRefreshSecret: configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret-key-change-in-production',
        jwtExpiresIn: '30m',
        jwtRefreshExpiresIn: '7d',
        googleClientId: configService.get<string>('GOOGLE_CLIENT_ID'),
        googleClientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
        googleCallbackUrl: configService.get<string>('GOOGLE_CALLBACK_URL'),
        facebookAppId: configService.get<string>('FACEBOOK_APP_ID'),
        facebookAppSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
        facebookCallbackUrl: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      }),
      inject: [ConfigService],
    }),
<% } %>
  ],
  controllers: [],
  providers: [],
})
export class <%= pascalName %>Module {}
